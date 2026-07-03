import { useNavigate } from "react-router-dom";
import { useRedirectFilter } from "../hooks/useRedirectFilter";

export function StatCard({ stat }) {
  const navigate = useNavigate();
  const { applyTicketRedirectFilter } = useRedirectFilter();
  const Icon = stat.icon || Activity;
  const handleNevigate = () => {
    applyTicketRedirectFilter(stat.label, stat.redirectTo);
    navigate(stat.redirectTo);
  }

  return (
    <article className={`dashboard-stat dashboard-tone-${stat.tone}`} href={stat.redirectTo} onClick={handleNevigate}>
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