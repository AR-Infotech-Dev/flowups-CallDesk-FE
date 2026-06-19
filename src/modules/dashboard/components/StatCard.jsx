import { useNavigate } from "react-router-dom";


export function StatCard({ stat }) {
  const navigate = useNavigate();
  const Icon = stat.icon || Activity;

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