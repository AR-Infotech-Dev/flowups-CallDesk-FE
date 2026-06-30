import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import Spinner from "../ui/Spinner";
import KanbanColumn from "./KanbanColumn";
import { KanbanCardPreview } from "./KanbanCard";
import { KanbanProvider } from "./KanbanContext";
import KanbanSkeleton from "./KanbanSkeleton";
import { useKanbanBoard } from "./useKanbanBoard";
import { findColumnIdForCard } from "./kanbanUtils";

function KanbanBoard({ rows = [], editRow, config, loading = false, onAfterUpdate, lazyLoad = false, reloadKey = "", onLoadColumnPage, allowUpdate = true, menuId, }) {
  const { columns, boardState, loadingColumns, updatingCardId, activeCardId, columnPaging, sensors, columnIds, activeCard, loadColumnPage, handleDragStart, handleDragEnd, handleDragCancel, } = useKanbanBoard({ rows, config, lazyLoad, reloadKey, onLoadColumnPage, allowUpdate, onAfterUpdate, });

  if (loading || loadingColumns) {
    return <KanbanSkeleton columns={columns} />;
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

      <KanbanProvider value={{ config, editRow, menuId }}>
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
