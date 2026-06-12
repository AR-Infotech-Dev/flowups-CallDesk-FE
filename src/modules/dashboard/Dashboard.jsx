import { Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2, Ticket, TrendingUp, UserCheck, Users, } from "lucide-react";
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip, } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../api/httpClient";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
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
export function Dashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const user = authSession?.user || {};
  const roleSlug = user?.role_slug || "user";
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoadingDashboard(true);
      setDashboardError("");

      const res = await makeRequest("/dashboard", {
        method: "GET",
      });

      if (!isMounted) return;

      if (res?.success) {
        setDashboardData(res.data || emptyDashboardData);
      } else {
        setDashboardData(emptyDashboardData);
        setDashboardError(res?.message || "Unable to load dashboard");
      }

      setLoadingDashboard(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

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
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-profile-mark">{getInitials(displayName)}</div>
          <div>
            <span className="dashboard-eyebrow">{dashboard.roleLabel}</span>
            <h1>{dashboard.title}</h1>
            <p>{dashboard.subtitle}</p>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          {loadingDashboard ? <span className="dashboard-state-chip">Loading</span> : null}
          {dashboardError ? <span className="dashboard-state-chip error">{dashboardError}</span> : null}
          {/* <button type="button" className="dashboard-filter-button">
            <CalendarDays size={15} />
            Today
          </button> */}
          {/* <button type="button" className="dashboard-filter-button active">
            <TrendingUp size={15} />
            This Month
          </button> */}
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

            <AlertTriangle size={18} />
          </div>

          <ProductExpiryAlerts
            items={dashboard.productExpiryAlerts}
            onUpdate={(product) => {
              navigate("/customers", {
                state: {
                  openCustomer: {
                    customer_id: product.customer_id,
                    getBackTo: '/dashboard',
                    action: "product_expiry",
                  },
                },
              });
            }}
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
    </main>
  );
}

export default Dashboard;
