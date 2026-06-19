import { Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2, X, Ticket, TrendingUp, UserCheck, Users, RefreshCw } from "lucide-react";
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip, } from "chart.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../api/httpClient";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ProductExpiryUpdateModal } from "./components/ProductExpiryUpdateModal";
import { AmcAlerts } from "./components/AmcAlerts";
import { ProductExpiryAlerts } from "./components/ProductExpiryAlerts";
import { ActivityList } from "./components/ActivityList";
import { BarChart } from "./components/BarChart";
import { DonutChart } from "./components/DonutChart";
import { StatCard } from "./components/StatCard";
import { TrendChart } from "./components/TrendChart";
import Input from "../../components/form-inputs/Input";
import { parseCustomerProducts, productMatchesAlert, isAdminRole, getRoleLabel } from "./utils/dashboard.utils";
import { getDashboard, getProduct, updateProductExpiry } from "./data/dashboard.service"
import { useDashboardData } from "./hooks/useDashboardData";
import { useProductExpiryUpdate } from "./hooks/useProductExpiryUpdate";
ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";




export function Dashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const user = authSession?.user || {};
  const roleSlug = user?.role_slug || "user";

  const { dashboard, loadDashboard ,loadingDashboard, dashboardError, dashboardFilter,setDashboardFilter,adminView} = useDashboardData();
  const { openProductExpiryModal, saveProductExpiry ,expiryModal,setExpiryModal ,closeProductExpiryModal,validateExpiryDate } = useProductExpiryUpdate({loadDashboard});
  
  return (
    <main className="dashboard-page">
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
              <span className="absolute -top-3 z-50">
                From date
              </span>
              <Input className="bg-white border border-slate-200" field={{ "type": "date", placeholder: 'From Date' }} onChange={(event) => setDashboardFilter((prev) => ({ ...prev, from_date: event.target.value }))} value={dashboardFilter.from_date} />
            </label>
            <label className="text-xs relative w-30.75">
              <span className="absolute -top-3 z-50">
                To date
              </span>
              <Input className="bg-white border border-slate-200" field={{ "type": "date" }} onChange={(event) => setDashboardFilter((prev) => ({ ...prev, to_date: event.target.value }))} value={dashboardFilter.to_date} />
            </label>
            <button onClick={() => setDashboardFilter((prev) => ({ from_date: null, to_date: null }))} className={` flex items-center justify-center h-7 w-7 rounded-lg bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200`} title="Clear Filter" >
              <X size={16} />
            </button>
            <button onClick={() => loadDashboard()} className={`flex items-center justify-center h-7 w-7 rounded-lg border border-slate-00 bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 `} title="Refresh Dashboard" >
              <RefreshCw className={`${loadingDashboard ? "animate-spin" : ""}`} size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-stat-grid" aria-label="Dashboard summary">
        {(dashboard.stats.length ? dashboard.stats : [{ key: "empty", label: "No Data", value: 0, delta: "0", tone: "blue", icon: Activity }]).map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel" onClick={() => navigate('/tickets')}>
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-section-label">Status</span>
              <h2>{adminView ? "All tickets" : "My tickets"}</h2>
            </div>
          </div>
          <DonutChart data={dashboard.ticketStatus} />
        </article>
        <article className="dashboard-panel dashboard-panel-wide" onClick={() => navigate('/tickets')}>
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-section-label">Trend</span>
              <h2>{adminView ? "Ticket volume" : "My resolved work"}</h2>
            </div>
            <strong>{adminView ? "+18.6%" : "+22.1%"}</strong>
          </div>
          <TrendChart data={dashboard.trend} />
        </article>
        <article className="dashboard-panel" onClick={() => navigate('/tickets')}>
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

          <AmcAlerts items={dashboard.amcAlerts} onRenew={(amc) => {
            navigate("/customers", {
              state: {
                openCustomer: {
                  customer_id: amc.id,
                  getBackTo: '/dashboard',
                  action: "amc_expiry",
                },
              },
            });
          }} />
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-section-label">
                Products
              </span>

              <h2>Expiry Alerts</h2>
            </div>

            <button className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => {
              navigate("/dashboard/product-expiry");
            }}  >
              view all
            </button>
          </div>

          <ProductExpiryAlerts
            items={dashboard.productExpiryAlerts}
            onUpdate={openProductExpiryModal}
          />
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
      <ProductExpiryUpdateModal
        alert={expiryModal.alert}
        loading={expiryModal.loading}
        saving={expiryModal.saving}
        expiryDate={expiryModal.expiryDate}
        error={expiryModal.error}
        onExpiryDateChange={(value) => setExpiryModal((current) => ({ ...current, expiryDate: value, error: validateExpiryDate(value, current.alert?.expiry_date) }))}
        onClose={closeProductExpiryModal}
        onSave={saveProductExpiry}
      />
    </main>
  );
}

export default Dashboard;
