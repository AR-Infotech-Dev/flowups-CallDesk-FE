export function ActivityList({ items }) {
  return (
    <div className="dashboard-activity-list">
      {(items.length ? items : [{ title: "No recent activity", meta: "0 updates available", tone: "blue" }]).map((item) => (
        <div className={`dashboard-activity-item dashboard-tone-${item.tone}`} key={`${item.title}-${item.meta}`}>
          <span className="dashboard-activity-dot" />
          <div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
