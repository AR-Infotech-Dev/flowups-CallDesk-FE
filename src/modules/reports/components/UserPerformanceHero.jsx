import { Award } from "lucide-react";

export function UserPerformanceHero({ userName, summary = {}, rating }) {
  return (
    <section className="performance-user-hero">
      <div className="performance-user-avatar">{String(userName).charAt(0).toUpperCase()}</div>
      <div>
        <span>User Performance</span>
        <h3>{userName}</h3>
        <p>
          Assigned Tickets: {summary?.assigned || 0} · Closed Tickets: {summary?.closed || 0} · Pending Tickets: {summary?.pending || 0}
        </p>
      </div>
      <div className="performance-rating">
        <Award size={16} />
        {rating}
      </div>
    </section>
  );
}
