import LinearProgress from "../ui/LinearProgress";

function AppShell({ topbar, sidebar, toolbar, children, overlay }) {
  return (
    <div className="app-shell">
      <LinearProgress />
      <div className="app-frame">
        {sidebar}
        <div className="main-frame">
          {topbar}
          <main className="content-area">
            {toolbar}
            {children}
          </main>
        </div>
        {overlay}
      </div>
    </div>
  );
}

export default AppShell;
