import { ATTENDANCE_STATUS, getInitials } from "../userWiseAttendanceReport.utils";

const getStatusMeta = (status) => ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.unavailable || { code: "-", label: "Not Available" };

const formatReportTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const formatCellDetails = (day) => {
  const meta = getStatusMeta(day?.status);
  if (!day?.record) return meta.label;

  const signIn = formatReportTime(day.record.sign_in_at);
  const signOut = day.record.sign_out_at ? formatReportTime(day.record.sign_out_at) : (day.record.sign_in_at ? "MSO" : "-");
  const location = day.record.sign_in_location || day.record.sign_out_location || day.record.location || "-";

  return [`Sign In: ${signIn}`, `Sign Out: ${signOut}`, `Location: ${location}`].join("\n");
};

function AttendanceMatrix({ dates, rows, loading }) {
  if (!loading && !rows.length) {
    return <div className="uwa-empty">Select filters and generate the report to view attendance.</div>;
  }

  return (
    <div className="uwa-matrix-scroll">
      <table className="uwa-matrix-table">
        <thead>
          <tr>
            <th className="uwa-employee-column shadow-xs">
              <span className="text-md font-bold ">
                Employee
              </span>
              <span>Name · Username</span>
            </th>
            {dates.map((date) => (
              <th key={date.key} className={`uwa-date-column ${date.isToday ? "is-today" : ""}`}>
                <strong>{date.day}</strong><span>{date.weekday}</span>
              </th>
            ))}
            <th className="uwa-summary-column border-l! border-gray-100! shadow-xs">
              <strong>Monthly Summary</strong>
              <span className="uwa-summary-head "><i>Present</i><i>Absent</i><i>Hours</i><i>Attendance</i></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user, index) => (
            <tr key={user.user_id}>
              <td className="uwa-employee-column shadow-xs">
                <span className={`uwa-avatar tone-${index % 5}`}>{getInitials(user.user_name || user.username)}</span>
                <span className="uwa-employee-copy"><strong>{user.user_name || user.username || "Unnamed user"}</strong><small>{user.username || user.email || "—"}</small></span>
              </td>
              {user.days.map((day) => {
                const meta = getStatusMeta(day.status);
                return (
                  <td key={day.key} className={`uwa-date-column ${day.isToday ? "is-today" : ""}`}>
                    <span className={`uwa-status uwa-status-${day.status || "unavailable"}`} title={formatCellDetails(day)}>{meta.code}</span>
                  </td>
                );
              })}
              <td className="uwa-summary-column border-l! border-gray-100! shadow-xs">
                <span className="uwa-summary-values">
                  <b className="is-present">{user.totals.present}</b>
                  <b className="is-absent">{user.totals.absent}</b>
                  {/* <b className="is-late">{user.totals.late}</b> */}
                  <b>{Math.round(user.totals.hours)}h</b>
                  <b className="uwa-rate"><span>{user.totals.rate}%</span><i><em style={{ width: `${user.totals.rate}%` }} /></i></b>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading ? <div className="uwa-loading">Loading attendance…</div> : null}
    </div>
  );
}

export default AttendanceMatrix;

