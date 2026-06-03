import { Clock3 } from "lucide-react";

function getActivityText(activity = {}) {
  return activity.text || activity.message || activity.title || activity.action || "Activity recorded";
}

function getActivityTime(activity = {}) {
  return activity.time || activity.created_at || activity.created_date || activity.createdAt || "";
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

function ActivityTimeline({ activities = [], loading }) {
  return (
    <section className="performance-panel performance-timeline-panel">
      <div className="performance-panel-head">
        <span>Activity</span>
        <h3>Activity Timeline</h3>
      </div>

      <div className="performance-timeline">
        {loading ? (
          <div className="performance-empty">Loading activity...</div>
        ) : activities.length ? (
          activities.slice(0, 12).map((activity, index) => (
            <div className="performance-timeline-item" key={activity.id || activity.activity_id || `${getActivityText(activity)}-${index}`}>
              <span className="performance-timeline-icon">
                <Clock3 size={13} />
              </span>
              <div>
                <strong>{formatTime(getActivityTime(activity)) || `Update ${index + 1}`}</strong>
                <p>{getActivityText(activity)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="performance-empty">No activity found for the selected filters.</div>
        )}
      </div>
    </section>
  );
}

export default ActivityTimeline;

