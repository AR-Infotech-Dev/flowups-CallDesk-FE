import ActionButton from "../../components/ui/ActionButton";

function ModulePageLayout({
  title,
  description,
  controls,
  table,
  cards,
  footer,
  children,
  classNames=""
}) {
  return (
    <section className="module-page">
      <div className="module-controls-card">
        <div className={`module-page-header ${classNames}`}>
          <div className="module-page-heading">
            <h2 className="module-page-title">{title}</h2>
            {description ? <p className="module-page-description">{description}</p> : null}
          </div>
        </div>
        {controls}
        {children}
      </div>
      
      {cards ? <div className="module-cards-panel">{cards}</div> : null} 
      {table ? <div className="module-table-panel">{table}</div> : null} 
      {footer ? <div className="module-table-footer">{footer}</div> : null}
    </section>
  );
}

export default ModulePageLayout;
