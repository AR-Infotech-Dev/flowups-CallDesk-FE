import { ActivityList } from "./ActivityList";
import { AmcAlerts } from "./AmcAlerts";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";
import { ProductExpiryAlerts } from "./ProductExpiryAlerts";
import { TrendChart } from "./TrendChart";

export function DashboardPanels({
  dashboard,
  adminView,
  onNavigateTickets,
  onNavigateProductExpiry,
  onRenewAmc,
  onUpdateProductExpiry,
}) {
  return (
    <section className="dashboard-grid">
      <article className="dashboard-panel" onClick={onNavigateTickets}>
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">Status</span>
            <h2>{adminView ? "All tickets" : "My tickets"}</h2>
          </div>
        </div>
        <DonutChart data={dashboard.ticketStatus} />
      </article>

      <article className="dashboard-panel dashboard-panel-wide" onClick={onNavigateTickets}>
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">Trend</span>
            <h2>{adminView ? "Ticket volume" : "My resolved work"}</h2>
          </div>
          <strong>{adminView ? "+18.6%" : "+22.1%"}</strong>
        </div>
        <TrendChart data={dashboard.trend} />
      </article>

      <article className="dashboard-panel" onClick={onNavigateTickets}>
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">Focus</span>
            <h2>{adminView ? "Operational pressure" : "Daily workload"}</h2>
          </div>
        </div>
        <BarChart data={dashboard.bars} />
      </article>

      <article className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">AMC</span>
            <h2>AMC Health</h2>
          </div>
        </div>
        <DonutChart data={dashboard.amcHealth} />
      </article>

      <article className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">AMC</span>
            <h2>Upcoming Renewals</h2>
          </div>
        </div>
        <AmcAlerts items={dashboard.amcAlerts} onRenew={onRenewAmc} />
      </article>

      <article className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">Products</span>
            <h2>Expiry Alerts</h2>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={onNavigateProductExpiry}>
            view all
          </button>
        </div>
        <ProductExpiryAlerts items={dashboard.productExpiryAlerts} onUpdate={onUpdateProductExpiry} />
      </article>

      <article className="dashboard-panel dashboard-panel-tall">
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-section-label">Activity</span>
            <h2>{adminView ? "Recent updates" : "My updates"}</h2>
          </div>
        </div>
        <ActivityList items={dashboard.activity} />
      </article>
    </section>
  );
}
