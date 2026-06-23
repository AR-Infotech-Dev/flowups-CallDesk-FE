import { useCallback, useEffect, useMemo, useState } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "react-toastify";
import { fetchKanbanColumns, updateKanbanCardStatus } from "./kanban.service";
import {
  buildKanbanState,
  findColumnIdForCard,
  normalizeKanbanColumns,
  reorderKanbanState,
} from "./kanbanUtils";

export const useKanbanBoard = ({
  rows = [],
  config,
  lazyLoad = false,
  reloadKey = "",
  onLoadColumnPage,
  allowUpdate = true,
  onAfterUpdate,
}) => {
  const [columns, setColumns] = useState([]);
  const [boardState, setBoardState] = useState({});
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [columnPaging, setColumnPaging] = useState({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const loadColumns = async () => {
      if (!config?.categoryParentSlug) {
        setColumns([]);
        return;
      }

      try {
        setLoadingColumns(true);
        const res = await fetchKanbanColumns(config);
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

  useEffect(() => {
    setBoardState(normalizedBoardState);
  }, [normalizedBoardState]);

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const activeCard = useMemo(() => {
    if (!activeCardId) return null;

    return Object.values(boardState)
      .flat()
      .find((item) => String(item._kanbanId) === String(activeCardId)) || null;
  }, [activeCardId, boardState]);

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!allowUpdate) {
      toast.error("You do not have permission to edit this record.");
      return;
    }

    if (!over) return;

    const draggingCardId = String(active.id);
    const sourceColumnId = findColumnIdForCard(boardState, draggingCardId);
    if (!sourceColumnId) return;

    const overData = over.data.current;
    const targetColumnId =
      overData?.type === "column"
        ? overData.columnId
        : overData?.type === "card"
          ? overData.columnId
          : findColumnIdForCard(boardState, String(over.id));

    if (!targetColumnId) return;

    const targetItems = boardState[targetColumnId] || [];
    const targetIndex =
      overData?.type === "card"
        ? targetItems.findIndex((item) => String(item._kanbanId) === String(over.id))
        : targetItems.length;

    const nextBoardState = reorderKanbanState(
      boardState,
      draggingCardId,
      sourceColumnId,
      targetColumnId,
      targetIndex,
      config || {},
      columns.find((column) => String(column.id) === String(targetColumnId))
    );

    if (nextBoardState === boardState) return;

    setBoardState(nextBoardState);

    if (sourceColumnId === targetColumnId) return;

    const movedCard = Object.values(boardState).flat().find((item) => String(item._kanbanId) === draggingCardId) || null;
    if (!movedCard) return;

    try {
      setUpdatingCardId(draggingCardId);
      const res = await updateKanbanCardStatus({ config, movedCard, targetColumnId });

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

  return {
    columns,
    boardState,
    loadingColumns,
    updatingCardId,
    activeCardId,
    columnPaging,
    sensors,
    columnIds,
    activeCard,
    loadColumnPage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
};
