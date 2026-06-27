import { RefreshCw, X } from "lucide-react";
import Input from "../../../components/form-inputs/Input";

export function DashboardHeader({
  dashboard,
  dashboardFilter,
  loadingDashboard,
  dashboardError,
  onFilterChange,
  onClearFilter,
  onRefresh,
}) {
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <div>
          <h1>Dashboard Overview</h1>
          <p>{dashboard.subtitle}</p>
        </div>
      </div>
      <div className="dashboard-hero-actions">
        {loadingDashboard ? <span className="dashboard-state-chip">Loading</span> : null}
        {dashboardError ? <span className="dashboard-state-chip error">{dashboardError}</span> : null}
        <div className="dashboard-filter-row">
          <label className="dashboard-filter-field">
            <span>From date</span>
            <Input
              className="bg-white border border-slate-200"
              field={{ type: "date", placeholder: "From Date" }}
              onChange={(event) => onFilterChange("from_date", event.target.value)}
              value={dashboardFilter.from_date || ""}
            />
          </label>
          <label className="dashboard-filter-field">
            <span>To date</span>
            <Input
              className="bg-white border border-slate-200"
              field={{ type: "date" }}
              onChange={(event) => onFilterChange("to_date", event.target.value)}
              value={dashboardFilter.to_date || ""}
            />
          </label>
          <button
            onClick={onClearFilter}
            className="dashboard-filter-icon-button"
            aria-label="Clear dashboard filters"
            title="Clear Filter"
          >
            <X size={16} />
          </button>
          <button
            onClick={onRefresh}
            className="dashboard-filter-icon-button"
            aria-label="Refresh dashboard"
            title="Refresh Dashboard"
          >
            <RefreshCw className={loadingDashboard ? "animate-spin" : ""} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
