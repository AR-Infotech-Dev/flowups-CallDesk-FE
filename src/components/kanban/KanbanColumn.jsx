import { useCallback, useEffect, useRef } from "react";
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
  const bodyRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadRequestedRef = useRef(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  const setBodyNode = useCallback((node) => {
    bodyRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  useEffect(() => {
    if (!loadingMore) {
      loadRequestedRef.current = false;
    }
  }, [loadingMore]);

  const requestNextPage = useCallback(() => {
    if (!hasMore || loadingMore || !onLoadMore || loadRequestedRef.current) {
      return;
    }

    loadRequestedRef.current = true;
    onLoadMore();
  }, [hasMore, loadingMore, onLoadMore]);

  const handleScroll = (event) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

    if (nearBottom) {
      requestNextPage();
    }
  };

  useEffect(() => {
    const root = bodyRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel || !hasMore || !onLoadMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          requestNextPage();
        }
      },
      {
        root,
        rootMargin: "140px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, onLoadMore, requestNextPage]);

  const resolvedTotal = Number.isFinite(Number(totalCount)) ? Number(totalCount) : items.length;

  return (
    <div className="block">
      <div className="kanban-column-top" style={{ backgroundColor: column.color || "var(--primary-100)" }}>&nbsp;</div>
      <section className="kanban-column">
        <header
          className="kanban-column-head"
          style={{
            // backgroundColor: column.color || "var(--primary-100)",
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
          ref={setBodyNode}
          className={`kanban-column-body ${isOver ? "is-over" : ""}`}
          onScroll={handleScroll}
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
          <div ref={sentinelRef} className="kanban-scroll-sentinel" aria-hidden="true" />
          {hasMore && !loadingMore ? (
            <button type="button" className="kanban-load-more" onClick={onLoadMore}>
              Load more
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default KanbanColumn;
