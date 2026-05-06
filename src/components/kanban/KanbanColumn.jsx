import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import KanbanCard from "./KanbanCard";
import { useKanbanContext } from "./KanbanContext";

function KanbanColumn({
  column,
  items,
  totalCount,
  loadingMore = false,
  hasMore = false,
  activeCardId = null,
  onLoadMore,
}) {
  const { config } = useKanbanContext();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  // Loads the next column page when the user scrolls close to the bottom.
  const handleColumnScroll = (event) => {
    if (!hasMore || loadingMore || !onLoadMore) {
      return;
    }

    const target = event.currentTarget;
    const bottomGap = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (bottomGap < 80) {
      onLoadMore();
    }
  };

  const resolvedTotal = Number.isFinite(Number(totalCount)) ? Number(totalCount) : items.length;

  return (
    <section className="kanban-column">
      <header
        className="kanban-column-head"
        style={{
          backgroundColor: column.color || "var(--primary-100)",
        }}
      >
        <div className="kanban-column-title-wrap">
          <span className="kanban-column-grip" aria-hidden="true">
            <GripVertical size={14} />
          </span>
          <div className="kanban-column-copy">
            <h3 className="kanban-column-title">{column.title}</h3>
            <span className="kanban-column-meta">
              {items.length} of {resolvedTotal}
            </span>
          </div>
        </div>
        <span className="kanban-column-count">{items.length}</span>
      </header>

      <div
        ref={setNodeRef}
        className={`kanban-column-body ${isOver ? "is-over" : ""}`}
        onScroll={handleColumnScroll}
      >
        <SortableContext items={items.map((item) => item._kanbanId)} strategy={verticalListSortingStrategy}>
          {items.length ? (
            items.map((item) => (
              <KanbanCard
                key={item._kanbanId}
                row={item}
                columnId={column.id}
                isActiveDrag={String(activeCardId) === String(item._kanbanId)}
              />
            ))
          ) : (
            <div className="kanban-column-empty">Drop items here</div>
          )}
        </SortableContext>
        {loadingMore ? <div className="kanban-column-loader">Loading more...</div> : null}
        {hasMore && !loadingMore ? (
          <button type="button" className="kanban-load-more" onClick={onLoadMore}>
            Load more
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default KanbanColumn;
