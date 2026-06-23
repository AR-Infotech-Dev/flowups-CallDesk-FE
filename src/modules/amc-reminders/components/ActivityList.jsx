function ActivityList({ rows = [], emptyText, render }) {
  if (!rows.length) {
    return <div className="amc-activity-empty">{emptyText}</div>;
  }

  return <div className="amc-activity-list">{rows.map(render)}</div>;
}

export default ActivityList;
