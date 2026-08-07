import { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { HelpCircle } from "lucide-react";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
const tooltipMap = {
  "User Monthly Productivity": "Shows how many tickets were completed month-wise by the selected user.",
  "Ticket Status Distribution": "Displays ticket counts grouped by their current status.",
  "Daily Closure Trend": "Shows daily ticket closing activity over time.",
  "Pending vs Closed Comparison": "Compares resolved tickets against pending tickets.",
};
const palette = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const toSeries = (items = [], fallbackLabel = "No Data") => {
  if (!Array.isArray(items) || !items.length) return [{ label: fallbackLabel, value: 0 }];
  return items.map((item, index) => ({
    label: item.label || item.month || item.date || item.status || item.name || `Item ${index + 1}`,
    value: Number(item.value ?? item.count ?? item.closed ?? item.total ?? 0),
    color: item.color || palette[index % palette.length],
  }));
};

const sharedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#0f172a", padding: 10 },
  },
};

function ChartPanel({ title, children }) {
  return (
    <article className="performance-chart-panel">
      <div className="performance-panel-head relative">
        <span>Analytics</span>
        
        <span className="group absolute top-2 right-2 flex items-center">
          <HelpCircle size={14} className="cursor-pointer text-slate-400 transition hover:text-slate-700" />
          {/* <span className="pointer-events-none absolute left-6 top-1/2 z-50 w-60 -translate-y-1/2 rounded-xl bg-blue-300 border border-blue-400 px-3 py-2 text-xs leading-5  opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100" style={{"color":"white"}}> */}
          <span className="pointer-events-none absolute right-0 top-6 z-50 w-60 rounded-xl bg-slate-900 px-3 py-2 font-extralight text-xs leading-5 text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100">
            {tooltipMap[title]}
          </span>
        </span>
        {/* <span className="performance-tooltip absolute top-2 right-2" ><HelpCircle size={14} /><span className="performance-tooltip-text"> { }</span> </span> */}

        <h3>{title}</h3>
      </div>
      <div className="performance-chart-box">{children}</div>
    </article>
  );
}

function PerformanceCharts({ charts = {} }) {
  const monthly = useMemo(() => toSeries(charts.monthlyProductivity || charts.userMonthlyProductivity || charts.productivity), [charts]);
  const status = useMemo(() => toSeries(charts.ticketStatusDistribution || charts.ticketStatus || charts.statusDistribution), [charts]);
  const daily = useMemo(() => toSeries(charts.dailyClosureTrend || charts.dailyClosure || charts.closureTrend), [charts]);
  const comparison = useMemo(() => {
    const source = charts.pendingVsClosed || charts.pendingClosedComparison || {};
    if (Array.isArray(source)) return toSeries(source);
    return [
      { label: "Pending", value: Number(source.pending || 0), color: "#f59e0b" },
      { label: "Closed", value: Number(source.closed || 0), color: "#22c55e" },
    ];
  }, [charts]);

  return (
    <section className="performance-chart-grid">
      <ChartPanel title="User Monthly Productivity">
        <Bar
          data={{
            labels: monthly.map((item) => item.label),
            datasets: [{ data: monthly.map((item) => item.value), backgroundColor: "#0ea5e9", borderRadius: 5 }],
          }}
          options={sharedOptions}
        />
      </ChartPanel>

      <ChartPanel title="Ticket Status Distribution">
        <Doughnut
          data={{
            labels: status.map((item) => item.label),
            datasets: [{ data: status.map((item) => item.value), backgroundColor: status.map((item) => item.color), borderColor: "#ffffff", borderWidth: 3 }],
          }}
          options={{ ...sharedOptions, cutout: "68%" }}
        />
      </ChartPanel>

      <ChartPanel title="Daily Closure Trend">
        <Line
          data={{
            labels: daily.map((item) => item.label),
            datasets: [{
              data: daily.map((item) => item.value),
              borderColor: "#14b8a6",
              backgroundColor: "rgba(20, 184, 166, 0.14)",
              borderWidth: 3,
              pointRadius: 3,
              fill: true,
              tension: 0.35,
            }],
          }}
          options={sharedOptions}
        />
      </ChartPanel>

      <ChartPanel title="Pending vs Closed Comparison">
        <Bar
          data={{
            labels: comparison.map((item) => item.label),
            datasets: [{ data: comparison.map((item) => item.value), backgroundColor: comparison.map((item) => item.color), borderRadius: 5 }],
          }}
          options={sharedOptions}
        />
      </ChartPanel>
    </section>
  );
}

export default PerformanceCharts;

