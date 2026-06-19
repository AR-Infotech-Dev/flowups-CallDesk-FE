export function BarChart({ data }) {
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
