import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "react-toastify";

import Spinner from "../ui/Spinner";
import { makeRequest } from "../../api/httpClient";
import KanbanColumn from "./KanbanColumn";
import { KanbanCardPreview } from "./KanbanCard";
import { KanbanProvider } from "./KanbanContext";
import {
  buildKanbanState,
  findColumnIdForCard,
  normalizeKanbanColumns,
  reorderKanbanState,
} from "./kanbanUtils";

function KanbanBoard({
  rows = [],
  editRow,
  config,
  loading = false,
  onAfterUpdate,
  lazyLoad = false,
  reloadKey = "",
  onLoadColumnPage,
}) {
  const [columns, setColumns] = useState([]);
  const [boardState, setBoardState] = useState({});
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [columnPaging, setColumnPaging] = useState({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Loads the category records that become Kanban columns.
  useEffect(() => {
    const loadColumns = async () => {
      if (!config?.categoryParentSlug) {
        setColumns([]);
        return;
      }

      try {
        setLoadingColumns(true);
        const res = await makeRequest(config.columnsApi || "/system/searchSlugList", {
          method: "POST",
          body: {
            tableName: config.categoryTableName || "categories",
            selectFields: config.categorySelectFields || "category_id,categoryName,cat_color",
            searchField: config.categorySearchField || "categoryName",
            slug: config.categoryParentSlug,
            status: config.categoryStatus || "active",
          },
        });

        const rawColumns = res?.data?.[0]?.sublist || [];
        setColumns(normalizeKanbanColumns(rawColumns, config));
      } catch (error) {
        toast.error("Unable to load kanban columns");
        setColumns([]);
      } finally {
        setLoadingColumns(false);
      }
    };

    loadColumns();
  }, [config]);

  const normalizedBoardState = useMemo(
    () => buildKanbanState(columns, rows, config || {}),
    [columns, rows, config]
  );

  // Normal table pagination sends `rows`; lazy Kanban starts with those rows and then appends column pages.
  useEffect(() => {
    setBoardState(normalizedBoardState);
  }, [normalizedBoardState]);

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const activeCard = useMemo(() => {
    if (!activeCardId) {
      return null;
    }

    return Object.values(boardState)
      .flat()
      .find((item) => String(item._kanbanId) === String(activeCardId)) || null;
  }, [activeCardId, boardState]);

  // Fetches a single column page and merges it into that column without duplicating cards.
  const loadColumnPage = useCallback(
    async (columnId, page = 1) => {
      if (!lazyLoad || !onLoadColumnPage || !columnId) {
        return;
      }

      setColumnPaging((current) => ({
        ...current,
        [columnId]: {
          ...(current[columnId] || {}),
          loading: true,
        },
      }));

      try {
        const column = columns.find((item) => String(item.id) === String(columnId));
        const res = await onLoadColumnPage({ columnId, page, column });
        const pageRows = Array.isArray(res?.rows) ? res.rows : [];
        const pageState = buildKanbanState(column ? [column] : columns, pageRows, config || {});
        const fallbackItems = normalizedBoardState[columnId] || [];
        const nextItems =
          page === 1 && !pageRows.length && fallbackItems.length
            ? fallbackItems
            : pageState[columnId] || [];
        const pagination = res?.pagination || {};

        setBoardState((current) => {
          const previousItems = page === 1 ? [] : current[columnId] || [];
          const mergedById = new Map();

          [...previousItems, ...nextItems].forEach((item) => {
            mergedById.set(String(item._kanbanId), item);
          });

          return {
            ...current,
            [columnId]: Array.from(mergedById.values()),
          };
        });

        setColumnPaging((current) => ({
          ...current,
          [columnId]: {
            page: pagination.page || page,
            totalPages: pagination.totalPages || page,
            total: pagination.total ?? Math.max(nextItems.length, fallbackItems.length),
            loading: false,
          },
        }));
      } catch (error) {
        setColumnPaging((current) => ({
          ...current,
          [columnId]: {
            ...(current[columnId] || {}),
            loading: false,
          },
        }));
        toast.error(error.message || "Unable to load kanban cards");
      }
    },
    [columns, config, lazyLoad, normalizedBoardState, onLoadColumnPage]
  );

  // In lazy mode every column has independent pagination, so reload all first pages on filter/sort change.
  useEffect(() => {
    if (!lazyLoad || !columns.length || !onLoadColumnPage) {
      return;
    }

    setBoardState(normalizedBoardState);
    setColumnPaging(Object.fromEntries(columns.map((column) => [column.id, { page: 0, totalPages: 1, total: 0, loading: false }])));
    columns.forEach((column) => loadColumnPage(column.id, 1));
  }, [columns, lazyLoad, loadColumnPage, onLoadColumnPage, reloadKey]);

  const handleDragStart = (event) => {
    setActiveCardId(String(event.active.id));
  };

  // Moves the card in UI first, then persists the new status to the backend.
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over) {
      return;
    }

    const activeCardId = String(active.id);
    const sourceColumnId = findColumnIdForCard(boardState, activeCardId);

    if (!sourceColumnId) {
      return;
    }

    const overData = over.data.current;
    const targetColumnId =
      overData?.type === "column"
        ? overData.columnId
        : overData?.type === "card"
          ? overData.columnId
          : findColumnIdForCard(boardState, String(over.id));

    if (!targetColumnId) {
      return;
    }

    const targetItems = boardState[targetColumnId] || [];
    const targetIndex =
      overData?.type === "card"
        ? targetItems.findIndex((item) => String(item._kanbanId) === String(over.id))
        : targetItems.length;

    const nextBoardState = reorderKanbanState(
      boardState,
      activeCardId,
      sourceColumnId,
      targetColumnId,
      targetIndex,
      config || {},
      columns.find((column) => String(column.id) === String(targetColumnId))
    );

    if (nextBoardState === boardState) {
      return;
    }

    setBoardState(nextBoardState);

    if (sourceColumnId === targetColumnId) {
      return;
    }

    const movedCard = Object.values(boardState).flat().find((item) => String(item._kanbanId) === activeCardId) || null;

    if (!movedCard) {
      return;
    }

    try {
      setUpdatingCardId(activeCardId);
      const updatePath = typeof config.updateApi === "function"
        ? config.updateApi(movedCard, targetColumnId)
        : config.appendIdToUpdateApi === false
          ? config.updateApi
          : `${config.updateApi}/${movedCard[config.idField]}`;

      const updateBody = typeof config.buildUpdateBody === "function"
        ? config.buildUpdateBody(movedCard, targetColumnId)
        : { [config.statusField]: targetColumnId };

      const res = await makeRequest(updatePath, {
        method: config.updateMethod || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (!res.success) {
        throw new Error(res?.message || "Unable to update status");
      }

      toast.success(config.successMessage || "Status updated");
      onAfterUpdate?.();
    } catch (error) {
      setBoardState(boardState);
      toast.error(error.message || "Unable to update status");
    } finally {
      setUpdatingCardId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
  };

  if (loading || loadingColumns) {
    return (
      <div className="kanban-loading">
        <Spinner />
      </div>
    );
  }

  if (!columns.length) {
    return <div className="kanban-empty">No kanban columns found for this category slug.</div>;
  }

  return (
    <div className="kanban-shell">
      {updatingCardId ? (
        <div className="kanban-updating">
          <Spinner size="sm" /> Updating status...
        </div>
      ) : null}

      <KanbanProvider value={{ config, editRow }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="kanban-board">
            {columnIds.map((columnId) => {
              const column = columns.find((item) => item.id === columnId);
              const paging = columnPaging[columnId] || {};
              const hasMore = lazyLoad && (paging.page || 1) < (paging.totalPages || 1);

              return (
                <KanbanColumn
                  key={columnId}
                  column={column}
                  items={boardState[columnId] || []}
                  totalCount={paging.total}
                  loadingMore={Boolean(paging.loading)}
                  hasMore={hasMore}
                  activeCardId={activeCardId}
                  onLoadMore={() => loadColumnPage(columnId, (paging.page || 1) + 1)}
                />
              );
            })}
          </div>
          <DragOverlay
            zIndex={999}
            dropAnimation={{
              duration: 180,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {activeCard ? (
              <KanbanCardPreview
                row={activeCard}
                columnId={activeCard._kanbanColumnId || findColumnIdForCard(boardState, activeCardId)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </KanbanProvider>
    </div>
  );
}

export default KanbanBoard;
