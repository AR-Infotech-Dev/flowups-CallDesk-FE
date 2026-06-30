import { Doughnut } from "react-chartjs-2";

export function DonutChart({ data }) {
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
