function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-backdrop auth-backdrop-left" />
      <div className="auth-backdrop auth-backdrop-right" />

      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">CRM</span>
          <div className="auth-brand-copy">
            <span className="auth-brand-label">Workspace Access</span>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="auth-card-body">{children}</div>
        {footer ? <div className="auth-card-footer">{footer}</div> : null}
      </section>
    </div>
  );
}

export default AuthShell;
