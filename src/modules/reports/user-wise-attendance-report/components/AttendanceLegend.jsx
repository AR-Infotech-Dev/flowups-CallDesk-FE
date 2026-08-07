import { ATTENDANCE_STATUS } from "../userWiseAttendanceReport.utils";

const statuses = ["present", "absent", "leave", "weekend", "unavailable"];

function AttendanceLegend() {
  return (
    <div className="uwa-legend">
      {statuses.map((status) => {
        const item = ATTENDANCE_STATUS[status] || { code: "-", label: status };
        return (
          <span key={status}>
            <i className={`uwa-status uwa-status-${status}`}>{item.code}</i>
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export default AttendanceLegend;

