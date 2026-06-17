import { Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2, X, Ticket, TrendingUp, UserCheck, Users, RefreshCw } from "lucide-react";
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip, } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useCallback, useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../api/httpClient";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Input from "../../components/form-inputs/Input";

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";


const emptyDashboardData = {
  role: "user",
  scope: "user",
  summary: [],
  charts: {
    ticketStatus: [],
    ticketTrend: [],
    workload: [],
  },
  recentActivity: [],
};

const statIconMap = {
  customers: Users,
  tickets: Ticket,
  followups: CalendarDays,
  users: UserCheck,
  companies: Building2,
  sla: Activity,
  myOpen: Ticket,
  myFollowups: CalendarDays,
  closed: CheckCircle2,
  overdue: AlertTriangle,
};

function getRoleLabel(roleSlug) {
  if (roleSlug === "super_admin") return "Super Admin";
  if (roleSlug === "admin") return "Admin";
  return "User";
}

function isAdminRole(roleSlug) {
  return roleSlug === "super_admin" || roleSlug === "admin";
}

function getInitials(name = "User") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatCard({ stat }) {
  const navigate = useNavigate();
  const Icon = stat.icon || statIconMap[stat.key] || Activity;

  return (
    <article className={`dashboard-stat dashboard-tone-${stat.tone}`} href={stat.redirectTo} onClick={() => navigate(stat.redirectTo)}>
      <div className="dashboard-stat-icon">
        <Icon size={18} />
      </div>
      <div className="dashboard-stat-copy">
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
      </div>
      <small>{stat.delta}</small>
    </article>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeData = data.length ? data : [{ label: "No Data", value: 0, color: "#cbd5e1" }];
  const chartData = {
    labels: safeData.map((item) => item.label),
    datasets: [
      {
        data: safeData.map((item) => item.value),
        backgroundColor: safeData.map((item) => item.color),
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        displayColors: true,
      },
    },
  };

  return (
    <div className="dashboard-donut-wrap">
      <div className="dashboard-chart-box dashboard-donut-box">
        <Doughnut data={chartData} options={options} />
        <div className="dashboard-donut-center">
          <strong>{total}</strong>
          <span>tickets</span>
        </div>
      </div>

      <div className="dashboard-legend">
        {safeData.map((item) => (
          <div className="dashboard-legend-row" key={item.label}>
            <span style={{ background: item.color }} />
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const safeData = data.length ? data : [{ label: "No Data", value: 0 }];
  const chartData = {
    labels: safeData.map((item) => item.label),
    datasets: [
      {
        label: "Tickets",
        data: safeData.map((item) => item.value),
        borderColor: "#0078d4",
        backgroundColor: "rgba(0, 120, 212, 0.14)",
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#0078d4",
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        pointRadius: 3,
        borderWidth: 3,
        fill: true,
        tension: 0.38,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 11, weight: 700 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e2e8f0" },
        ticks: { color: "#64748b", font: { size: 11, weight: 700 }, padding: 8 },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        displayColors: false,
      },
    },
  };

  return (
    <div className="dashboard-chart-box dashboard-trend-box">
      <Line data={chartData} options={options} />
    </div>
  );
}

function BarChart({ data }) {
  const safeData = data.length ? data : [{ label: "No Data", value: 0, color: "#cbd5e1" }];

  return (
    <div className="dashboard-workload-list">
      {safeData.map((item) => (
        <div className="dashboard-workload-item" key={item.label}>
          <span className="dashboard-workload-accent" style={{ background: item.color }} />
          <div className="dashboard-workload-copy">
            <strong>{item.value || 0}</strong>
            <span>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ items }) {
  return (
    <div className="dashboard-activity-list">
      {(items.length ? items : [{ title: "No recent activity", meta: "0 updates available", tone: "blue" }]).map((item) => (
        <div className={`dashboard-activity-item dashboard-tone-${item.tone}`} key={`${item.title}-${item.meta}`}>
          <span className="dashboard-activity-dot" />
          <div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AmcAlerts({ items = [], onRenew }) {
  return (
    <div className="space-y-2">
      {(items.length
        ? items.slice(0, 5)
        : [
          {
            customer: "No AMC Alerts",
            daysLeft: 0,
            tone: "green",
          },
        ]
      ).map((item) => (
        <div
          key={item.customer}
          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {item.customer}
            </p>

            <p className={`text-xs font-medium ${item.daysLeft < 0 ? "text-red-500" : "text-amber-500"} `}>
              {item.daysLeft < 0
                ? `Expired ${Math.abs(item.daysLeft)} days ago`
                : `Expires in ${item.daysLeft} days`}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-amber-900">
              RP : {item.responsible_person}
            </p>
          </div>

          {item.customer !== "No AMC Alerts" && (
            <>
              <button
                className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                onClick={() => onRenew?.(item)}
              >
                Renew
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ProductExpiryAlerts({ items = [], onUpdate }) {
  return (
    <div className="space-y-2">
      {items.length ? (
        items.slice(0, 5).map((item) => (
          <div
            key={`${item.customer_id}-${item.serial_number}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {item.customer_name}
              </p>

              <p className="truncate text-xs text-slate-500">
                <span>{item.product_name}</span>
              </p>
            </div>

            <div className="mx-3 text-xs font-medium text-red-600">
              {item.days_left < 0 ? <span className="text-xs font-medium text-red-600">Expired {Math.abs(item.days_left)} days ago</span> : <span className="text-xs font-medium text-amber-600">Expires in {item.days_left} days</span>}
            </div>

            <button
              className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white"
              onClick={() => onUpdate(item)}
            >
              Update
            </button>
          </div>
        ))
      ) : (
        <div className="py-4 text-center text-sm text-slate-500">
          No expiring products 🎉
        </div>
      )}
    </div>
  );
}

const parseCustomerProducts = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const productMatchesAlert = (product = {}, alert = {}) => {
  const sameSerial = product.serial_number && alert.serial_number && String(product.serial_number) === String(alert.serial_number);
  const sameProductName = product.product_name && alert.product_name && String(product.product_name) === String(alert.product_name);
  const sameExpiry = product.expiry_date && alert.expiry_date && String(product.expiry_date).slice(0, 10) === String(alert.expiry_date).slice(0, 10);

  return sameSerial || (sameProductName && sameExpiry);
};

const getTodayDateInputValue = () => {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

const getDateInputMinValue = (currentExpiry = "") => {
  const todayValue = getTodayDateInputValue();
  if (!currentExpiry) return todayValue;

  const currentExpiryValue = String(currentExpiry).slice(0, 10);
  const currentExpiryDate = new Date(`${currentExpiryValue}T00:00:00`);
  const todayDate = new Date(`${todayValue}T00:00:00`);

  if (Number.isNaN(currentExpiryDate.getTime()) || currentExpiryDate < todayDate) {
    return todayValue;
  }

  return currentExpiryValue;
};

function ProductExpiryUpdateModal({ alert, loading, saving, expiryDate, error, onExpiryDateChange, onClose, onSave }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Update Product Expiry</h3>
          <p className="mt-1 text-xs text-slate-500">{alert.customer_name} - {alert.product_name || "Product"}</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div><strong>Product:</strong> {alert.product_name || "-"}</div>
            <div><strong>Serial:</strong> {alert.serial_number || "-"}</div>
            <div><strong>Current expiry:</strong> {alert.expiry_date || "-"}</div>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            New Expiry Date
            <input
              type="date"
              min={getDateInputMinValue(alert.expiry_date)}
              value={expiryDate}
              onChange={(event) => onExpiryDateChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              disabled={loading || saving}
            />
            {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={onSave} disabled={loading || saving || !expiryDate}>
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
export function Dashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const user = authSession?.user || {};
  const roleSlug = user?.role_slug || "user";
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [dashboardFilter, setDashboardFilter] = useState({
    from_date: null,
    to_date: null
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [expiryModal, setExpiryModal] = useState({
    alert: null,
    customer: null,
    expiryDate: "",
    error: "",
    loading: false,
    saving: false,
  });

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError("");

    const res = await makeRequest("/dashboard", {
      method: "POST",
      body: dashboardFilter
    });

    if (res?.success) {
      setDashboardData(res.data || emptyDashboardData);
    } else {
      setDashboardData(emptyDashboardData);
      setDashboardError(res?.message || "Unable to load dashboard");
    }

    setLoadingDashboard(false);
  }, [dashboardFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openProductExpiryModal = async (alert) => {
    setExpiryModal({
      alert,
      customer: null,
      expiryDate: String(alert.expiry_date || "").slice(0, 10),
      error: "",
      loading: true,
      saving: false,
    });

    const res = await makeRequest(`/customers/${alert.customer_id}`, {
      method: "GET",
    });

    if (!res?.success) {
      toast.error(res?.message || "Unable to load customer products");
      setExpiryModal((current) => ({ ...current, loading: false }));
      return;
    }

    setExpiryModal((current) => ({
      ...current,
      customer: res.data || {},
      loading: false,
    }));
  };

  const closeProductExpiryModal = () => {
    setExpiryModal({
      alert: null,
      customer: null,
      expiryDate: "",
      error: "",
      loading: false,
      saving: false,
    });
  };

  const validateExpiryDate = (expiryDate, currentExpiry = "") => {
    if (!expiryDate) return "Expiry date is required";

    const selectedDate = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return "Select a valid expiry date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return "Expiry date cannot be in the past";

    const currentExpiryValue = String(currentExpiry || "").slice(0, 10);
    const currentExpiryDate = currentExpiryValue ? new Date(`${currentExpiryValue}T00:00:00`) : null;
    if (currentExpiryDate && !Number.isNaN(currentExpiryDate.getTime()) && currentExpiryDate >= today && selectedDate < currentExpiryDate) {
      return "New expiry date cannot be before current expiry date";
    }

    return "";
  };

  const saveProductExpiry = async () => {
    const { alert, customer, expiryDate } = expiryModal;
    if (!alert?.customer_id || !customer || !expiryDate) return;

    const validationError = validateExpiryDate(expiryDate, alert.expiry_date);
    if (validationError) {
      setExpiryModal((current) => ({ ...current, error: validationError }));
      toast.error(validationError);
      return;
    }

    const products = parseCustomerProducts(customer.customer_products || customer.products);
    const matchedIndex = products.findIndex((product) => productMatchesAlert(product, alert));

    if (matchedIndex < 0) {
      toast.error("Product not found in customer products");
      return;
    }

    const customerProducts = products.map((product, index) => (
      index === matchedIndex
        ? { ...product, expiry_date: expiryDate }
        : product
    ));

    setExpiryModal((current) => ({ ...current, saving: true }));

    const payload = {
      ...customer,
      customer_products: customerProducts,
    };
    delete payload.products;
    delete payload.product_ids;

    const res = await makeRequest(`/customers/${alert.customer_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res?.success) {
      toast.error(res?.message || "Unable to update product expiry");
      setExpiryModal((current) => ({ ...current, saving: false }));
      return;
    }

    toast.success("Product expiry updated");
    closeProductExpiryModal();
    loadDashboard();
  };

  const resolvedRoleSlug = dashboardData?.role || roleSlug;
  const adminView = dashboardData?.scope ? dashboardData.scope === "admin" : isAdminRole(roleSlug);

  const dashboard = useMemo(
    () => ({
      roleLabel: getRoleLabel(resolvedRoleSlug),
      stats: (dashboardData.summary || []).map((stat) => ({
        ...stat,
        icon: statIconMap[stat.key] || Activity,
        value: stat.value ?? 0,
        delta: stat.delta || "0",
        tone: stat.tone || "blue",
      })),
      ticketStatus: dashboardData.charts?.ticketStatus || [],
      trend: dashboardData.charts?.ticketTrend || [],
      bars: dashboardData.charts?.workload || [],
      activity: dashboardData.recentActivity || [],
      amcHealth: dashboardData.charts?.amcHealth || [],
      amcAlerts: dashboardData.amcAlerts || [],
      productExpiryAlerts: dashboardData.productExpiryAlerts || [],
      title: adminView ? "Operations Dashboard" : "My Dashboard",
      subtitle: adminView ? "Live CRM workload, team performance, and SLA health." : "Your assigned work, follow-ups, and ticket progress.",
    }),
    [adminView, dashboardData, resolvedRoleSlug]
  );

  const displayName = user?.name || user?.userName || user?.email || "User";

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
