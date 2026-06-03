import { HelpCircle, AlertTriangle, CheckCircle2, Clock, Gauge, ListChecks, Send, TimerReset } from "lucide-react";


const cards = [
  { key: "assigned", label: "Total Assigned Tickets", icon: ListChecks, tone: "blue", description: "Total number of tickets assigned to the selected user." },
  { key: "closed", label: "Closed Tickets", icon: CheckCircle2, tone: "green", description: "Tickets successfully resolved and closed.", },
  { key: "pending", label: "Pending Tickets", icon: Clock, tone: "amber", description: "Tickets that are still open or waiting for action.", },
  { key: "delegated", label: "Delegated Tickets", icon: Send, tone: "blue", description: "Tickets reassigned or forwarded to another user.", },
  { key: "overdue", label: "Overdue Tickets", icon: AlertTriangle, tone: "red", description: "Tickets whose due date has already passed.", },
  { key: "avg_resolution_time", label: "Average Resolution Time", icon: TimerReset, tone: "cyan", suffix: " hrs", description: "Average time taken by the user to resolve a ticket.", },
  { key: "productivity_score", label: "Productivity Score", icon: Gauge, tone: "purple", description: "Performance score calculated using closed and overdue tickets.", },
];

function formatCardValue(value, suffix = "") {
  if (value === undefined || value === null || value === "") return `0${suffix}`;
  if (typeof value === "number") return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
  return `${value}${suffix}`;
}

function PerformanceCards({ summary = {}, loading }) {
  return (
    <section className="performance-card-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.key} className={`performance-card performance-tone-${card.tone}  relative`}>
            <div className="performance-card-icon">
              <Icon size={17} />
            </div>
            <div>
              <span>
                {card.label}
              </span>
              <strong>{loading ? "-" : formatCardValue(summary[card.key], card.suffix)}</strong>
            </div>
            <span className="performance-tooltip absolute top-2 right-2" ><HelpCircle size={14} /><span className="performance-tooltip-text"> {card.description}</span> </span>
          </article>
        );
      })}
    </section>
  );
}

export default PerformanceCards;
