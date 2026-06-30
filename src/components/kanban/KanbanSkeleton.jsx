function KanbanSkeleton({ columns = [] }) {
  const skeletonColumns = columns.length
    ? columns
    : Array.from({ length: 4 }).map((_, index) => ({
      id: `skeleton-${index}`,
      title: "",
      color: "var(--primary-100)",
    }));

  return (
    <div className="kanban-shell">
      <div className="kanban-board">
        {skeletonColumns.map((column, columnIndex) => (
          <section className="kanban-column kanban-column-skeleton" key={column.id || columnIndex}>
            <div className="kanban-column-top" style={{ backgroundColor: column.color || "var(--primary-100)" }}>&nbsp;</div>
            <div className="kanban-column-head">
              <div className="kanban-column-title-wrap">
                <span className="kanban-column-grip kanban-skeleton-grip" aria-hidden="true" />
                <div className="kanban-column-copy">
                  {column.title ? (
                    <h3 className="kanban-column-title">{column.title}</h3>
                  ) : (
                    <span className="kanban-skeleton-line kanban-skeleton-title" />
                  )}
                  <span className="kanban-skeleton-line kanban-skeleton-meta" />
                </div>
              </div>
              <span className="kanban-skeleton-count" />
            </div>
            <div className="kanban-column-body">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div className="kanban-card kanban-card-skeleton" key={cardIndex}>
                  <div className="kanban-card-head">
                    <span className="kanban-skeleton-grip" />
                    <div className="kanban-card-title-wrap">
                      <span className="kanban-skeleton-line kanban-skeleton-card-title" />
                    </div>
                  </div>
                  <div className="kanban-card-body">
                    <div className="kanban-skeleton-row kanban-skeleton-date-row">
                      <span className="kanban-skeleton-icon" />
                      <span className="kanban-skeleton-line kanban-skeleton-card-date" />
                    </div>
                    <div className="kanban-skeleton-row">
                      <span className="kanban-skeleton-icon" />
                      <span className="kanban-skeleton-line kanban-skeleton-label" />
                      <span className="kanban-skeleton-line kanban-skeleton-value" />
                    </div>
                    <div className="kanban-skeleton-row">
                      <span className="kanban-skeleton-icon" />
                      <span className="kanban-skeleton-line kanban-skeleton-label short" />
                      <span className="kanban-skeleton-line kanban-skeleton-value short" />
                    </div>
                  </div>
                  <div className="kanban-card-footer">
                    <div className="kanban-skeleton-tags">
                      <span className="kanban-skeleton-pill" />
                      <span className="kanban-skeleton-pill short" />
                    </div>
                    <span className="kanban-skeleton-avatar" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default KanbanSkeleton;
