import { formatWorkMinutes, workReportTableHeaders } from "../utils/workReport.utils";

export function WorkReportTable({ rows, loading, sortConfig, onSort }) {
  if (loading) {
    return <div className="work-report-empty">Loading work report...</div>;
  }

  return (
    <div className="work-report-table-panel">
      <div className="work-report-table-scroll">
        <table className="work-report-table">
          <thead>
            <tr>
              {workReportTableHeaders.map(([key, label]) => (
                <th key={key}>
                  <button type="button" onClick={() => key !== "work_details" && onSort(key)}>
                    {label}
                    {sortConfig.key === key ? <span>{sortConfig.direction === "ASC" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={workReportTableHeaders.length} className="work-report-empty-cell">No work logs found</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.work_log_id}>
                <td>{row.work_date}<br /><span>{row.work_time}</span></td>
                <td><strong>{row.employee_name || "-"}</strong></td>
                <td>{row.ticket_no || "-"}</td>
                <td>{row.client_name || "-"}</td>
                <td>{row.company_name || "-"}</td>
                <td><strong>{formatWorkMinutes(row.spent_minutes)}</strong></td>
                <td className="work-report-details">{row.work_details || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
