function FlyoutPanel({ isOpen, onClose, title ,subtitle , closeButton, children, footer, panelClassName = "" }) {
  
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className={`flyout-overlay`} onClick={onClose}>
        <div className="relative">
          {closeButton}
        </div>
        <aside
          className={`flyout-panel ${isOpen ? "open" : "close"} ${panelClassName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="overlay_header">
            <div className="ws_container">
                <h2 className="page_title">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="tab-pane panel_overflow">
            {children}
          </div>
          <div className="flyout-footer">{footer}</div>
        </aside>
      </div>
    </>
  );
}

export default FlyoutPanel;
