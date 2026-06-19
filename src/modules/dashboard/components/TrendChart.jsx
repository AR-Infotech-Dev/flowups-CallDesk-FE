import { Line } from "react-chartjs-2";

export function TrendChart({ data }) {
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
