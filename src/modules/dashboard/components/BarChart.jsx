import { useNavigate } from "react-router-dom";
import { useRedirectFilter } from "../hooks/useRedirectFilter";

export function BarChart({ data }) {
  const safeData = data.length ? data : [{ label: "No Data", value: 0, color: "#cbd5e1" }];
  const navigate = useNavigate();
  const { applyTicketRedirectFilter } = useRedirectFilter();
  const handleNevigate = (item) => {
    applyTicketRedirectFilter(item.label);
    navigate("/tickets");
  }

  return (
    <div className="dashboard-workload-list">
      {safeData.map((item) => (
        <div className="dashboard-workload-item" key={item.label} onClick={() => handleNevigate(item)}>
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
