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
    <section className="dashboard-hero relative">
      <div className="dashboard-hero-copy">
        <div>
          <h1>Dashboard Overview</h1>
          <p>{dashboard.subtitle}</p>
        </div>
      </div>
      <div className="dashboard-hero-actions absolute right-1 bottom-1">
        {loadingDashboard ? <span className="dashboard-state-chip">Loading</span> : null}
        {dashboardError ? <span className="dashboard-state-chip error">{dashboardError}</span> : null}
        <div className="flex items-baseline-last gap-2 relative">
          <label className="text-xs relative w-30.75">
            <span className="absolute -top-3 z-50">From date</span>
            <Input
              className="bg-white border border-slate-200"
              field={{ type: "date", placeholder: "From Date" }}
              onChange={(event) => onFilterChange("from_date", event.target.value)}
              value={dashboardFilter.from_date || ""}
            />
          </label>
          <label className="text-xs relative w-30.75">
            <span className="absolute -top-3 z-50">To date</span>
            <Input
              className="bg-white border border-slate-200"
              field={{ type: "date" }}
              onChange={(event) => onFilterChange("to_date", event.target.value)}
              value={dashboardFilter.to_date || ""}
            />
          </label>
          <button
            onClick={onClearFilter}
            className="flex items-center justify-center h-7 w-7 rounded-lg bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
            title="Clear Filter"
          >
            <X size={16} />
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-00 bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
            title="Refresh Dashboard"
          >
            <RefreshCw className={loadingDashboard ? "animate-spin" : ""} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
