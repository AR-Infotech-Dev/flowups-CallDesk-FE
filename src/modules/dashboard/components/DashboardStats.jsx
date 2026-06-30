import { Activity } from "lucide-react";
import { StatCard } from "./StatCard";

const EMPTY_STATS = [
  { key: "empty", label: "No Data", value: 0, delta: "0", tone: "blue", icon: Activity },
];

export function DashboardStats({ stats = [] }) {
  return (
    <section className="dashboard-stat-grid" aria-label="Dashboard summary">
      {(stats.length ? stats : EMPTY_STATS).map((stat) => (
        <StatCard key={stat.key} stat={stat} />
      ))}
    </section>
  );
}
