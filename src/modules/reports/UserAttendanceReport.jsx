import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, LogIn, RotateCcw, Search, Timer, TriangleAlert, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import ModulePagination from "../shared/ModulePagination";
import { getCurrentSession } from "../../auth/utils/authStorage";
import { fetchReportUsers } from "./performance.service";
import { fetchUserAttendanceReport } from "./userAttendanceReport.service";
import "./company-customer-report.css";
import "./user-attendance-report.css";

const toDateInput = (value) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const getDefaultFilters = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const sessionUser = getCurrentSession()?.user || {};
  return {
    user_id: "",
    company_id: String(sessionUser.company_id || ""),
    from_date: toDateInput(monthStart),
    to_date: toDateInput(today),
  };
};

const EMPTY_REPORT = {
  user: {},
  company: {},
  summary: {},
  attendance: [],
  pagination: {},
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const formatDuration = (value) => {
  const totalSeconds = Math.max(Number(value) || 0, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const summaryItems = [
  { key: "total_days", label: "Logged Days", icon: CalendarCheck2, tone: "blue" },
  { key: "present_days", label: "Present Days", icon: LogIn, tone: "cyan" },
  { key: "completed_days", label: "Complete Days", icon: CheckCircle2, tone: "green" },
  { key: "missing_sign_out", label: "Missing Sign Out", icon: TriangleAlert, tone: "red" },
  { key: "total_work_seconds", label: "Total Work Time", icon: Timer, tone: "violet", duration: true },
  { key: "average_work_seconds", label: "Average / Day", icon: Clock3, tone: "amber", duration: true },
];

function UserAttendanceReport() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(false);

  const selectedUser = useMemo(
    () => users.find((item) => String(item.value) === String(filters.user_id)),
    [users, filters.user_id]
  );

  useEffect(() => {
    let mounted = true;
    fetchReportUsers().then((items) => {
      if (mounted) setUsers(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const loadReport = async (nextFilters = appliedFilters, page = 1) => {
    if (!nextFilters.user_id) {
      toast.error("Please select a user.");
      return;
    }

    setLoading(true);
    const response = await fetchUserAttendanceReport(nextFilters, page);
    setLoading(false);

    if (!response.success) {
      toast.error(response.message);
      return;
    }

    setReport(response);
  };

  const generateReport = () => {
    setAppliedFilters(filters);
    loadReport(filters, 1);
  };

  const resetReport = () => {
    const nextFilters = getDefaultFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setReport(EMPTY_REPORT);
  };

  return (
    <section className="company-ticket-report-page user-attendance-report-page">
      <header className="company-ticket-report-header">
        <div>
          <span>Attendance Report</span>
          <h2>User Sign-in / Sign-out</h2>
          <p>Day-wise attendance generated from user location logs.</p>
        </div>
        <div className="company-ticket-report-company">
          <UserRound size={16} />
          <span>{report.user?.user_name || selectedUser?.label || "Select user"}</span>
        </div>
      </header>

      <div className="company-ticket-report-filters user-attendance-report-filters">
        <label>
          <span>User</span>
          <select value={filters.user_id} onChange={(event) => updateFilter("user_id", event.target.value)}>
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.value} value={user.value}>{user.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>From Date</span>
          <input type="date" value={filters.from_date} onChange={(event) => updateFilter("from_date", event.target.value)} />
        </label>
        <label>
          <span>To Date</span>
          <input type="date" value={filters.to_date} onChange={(event) => updateFilter("to_date", event.target.value)} />
        </label>
        <div className="company-ticket-report-filter-actions">
          <button type="button" className="primary" disabled={loading} onClick={generateReport}>
            <Search size={14} />
            {loading ? "Loading..." : "Generate"}
          </button>
          <button type="button" disabled={loading} onClick={resetReport}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="company-ticket-report-scroll">
        <section className="company-ticket-report-summary user-attendance-report-summary">
          {summaryItems.map(({ key, label, icon: Icon, tone, duration }) => (
            <article key={key} className={`company-ticket-summary-card ${tone}`}>
              <span><Icon size={15} /></span>
              <div>
                <small>{label}</small>
                <strong className={duration ? "attendance-duration-summary" : ""}>
                  {duration ? formatDuration(report.summary?.[key]) : Number(report.summary?.[key] || 0)}
                </strong>
              </div>
            </article>
          ))}
        </section>

        <section className="company-ticket-report-panel">
          <div className="company-ticket-report-panel-head">
            <div>
              <span>Daily Log</span>
              <h3>Attendance Breakdown</h3>
            </div>
            <p>{report.pagination?.total || 0} logged days</p>
          </div>

          <div className="company-ticket-report-table-wrap">
            <table className="company-ticket-report-table user-attendance-report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sign In</th>
                  <th>Sign In Location</th>
                  <th>Sign Out</th>
                  <th>Sign Out Location</th>
                  <th>Work Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.attendance.length ? report.attendance.map((row) => (
                  <tr key={row.attendance_date}>
                    <td><strong>{formatDate(row.attendance_date)}</strong></td>
                    <td>
                      <span>{formatTime(row.sign_in_at)}</span>
                      <small>{Number(row.sign_in_count || 0)} log{Number(row.sign_in_count || 0) === 1 ? "" : "s"}</small>
                    </td>
                    <td className="attendance-location" title={row.sign_in_location || "-"}>{row.sign_in_location || "-"}</td>
                    <td>
                      <span>{formatTime(row.sign_out_at)}</span>
                      <small>{Number(row.sign_out_count || 0)} log{Number(row.sign_out_count || 0) === 1 ? "" : "s"}</small>
                    </td>
                    <td className="attendance-location" title={row.sign_out_location || "-"}>{row.sign_out_location || "-"}</td>
                    <td><b>{row.work_seconds === null ? "-" : formatDuration(row.work_seconds)}</b></td>
                    <td>
                      <span className={`attendance-status ${row.attendance_status === "Complete" ? "complete" : "incomplete"}`}>
                        {row.attendance_status || "-"}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="company-ticket-report-empty">
                      {loading ? "Loading attendance report..." : "Select a user and generate the attendance report."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ModulePagination
            pagination={report.pagination}
            onPageChange={(nextPage) => loadReport(appliedFilters, nextPage)}
          />
        </section>
      </div>
    </section>
  );
}

export default UserAttendanceReport;
