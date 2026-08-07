import { useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import TicketPreview from "./TicketPreview";
import { formatReportDate, formatReportMinutesSeconds } from "../../report.utils";

const columns = [
  { key: "ticket_no", label: "Ticket Number", width: 150 },
  { key: "customer_name", label: "Customer Name", width: 220 },
  { key: "ticket_priority", label: "Priority", width: 130 },
  { key: "ticket_status", label: "Ticket Status", width: 150 },
  { key: "assigned_date", label: "Assigned Date", width: 150 },
  { key: "due_date", label: "Due Date", width: 150 },
  { key: "call_direction", label: "Direction", width: 150 },
  { key: "resolution_time", label: "Resolution Time", width: 160 },
];

const valueKeys = {
  ticket_no: ["ticket_no", "ticketNo", "ticket_number", "ticket_id"],
  customer_name: ["customer_name", "customerName", "client_name", "client_id", "name"],
  ticket_priority: ["priority_name", "ticket_priority_name", "ticket_priority", "priority"],
  ticket_status: ["status_name", "ticket_status_name", "ticket_status", "status"],
  assigned_date: ["assigned_date", "created_date", "start_date", "createdAt"],
  due_date: ["due_date", "dueDate"],
  call_direction: ["call_direction"],
  resolution_time: ["resolution_time", "resolutionTime", "resolve_time", "avg_resolution_time"],
};

function pick(row = {}, key) {
  const foundKey = valueKeys[key].find((item) => row[item] !== undefined && row[item] !== null && row[item] !== "");
  return foundKey ? row[foundKey] : "";
}

function formatValue(row, key) {
  const value = pick(row, key);
  if (key.includes("date")) return formatReportDate(value);
  if (key === "resolution_time" && value !== "") {
    return formatReportMinutesSeconds(value, row.resolution_time_seconds);
  }
  return value || "-";
}

function PerformanceTable({ rows = [], loading, pagination = {}, searchText, sortConfig, onSearchChange, onSortChange, onPageChange }) {
  const page = Number(pagination.page || 1);
  const [isOpenPreview, setIsOpenPreview] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState({});

  const totalPages = Number(pagination.totalPages || pagination.total_pages || 1);
  const total = Number(pagination.total || rows.length || 0);
  const handleClose = () => {
    setIsOpenPreview(false);
    setSelectedTicket({});
  };
  const handleOpen = (ticket) => {
    setIsOpenPreview(true);
    setSelectedTicket(ticket);
  };
  return (
    <section className="performance-panel performance-table-panel relative">
      <div className="performance-table-toolbar">
        <div className="performance-panel-head">
          <span>Tickets</span>
          <h3>Ticket Performance Detail</h3>
        </div>
        <label className="performance-table-search">
          <Search size={14} />
          <input
            type="search"
            value={searchText || ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search tickets"
          />
        </label>
      </div>



      <div className="performance-table-scroll relative">
        <TicketPreview
          isOpen={isOpenPreview}
          handleClose={handleClose}
          selectedTicket={selectedTicket}
        />
        <table className="performance-table">
          <thead>
            <tr style={{ width: "100%" }} >
              {columns.map((column) => {
                const active = sortConfig?.key === column.key;
                return (
                  <th key={column.key} style={{ minWidth: column.width }}>
                    <button type="button" onClick={() => onSortChange?.(column.key)}>
                      {column.label}
                      {active && (sortConfig.direction === "ASC" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr style={{ width: "100%" }} key={`loading-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ minWidth: column.width, width: column.width }}>
                      <span className="performance-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, index) => {
                row.call_direction = row.call_direction === "in" ? "Incomming" : "Outgoing";
                const isAmc = row.amc_call === "y" ? { backgroundColor: "#14ff142e" } : {};
                return (
                  <tr
                    key={row.ticket_id || row.ticketID || row.id || index}
                    className={`cursor-pointer`}
                    style={{ width: "100%" }}
                    tabIndex={0}
                    onClick={() => handleOpen(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpen(row);
                      }
                    }}
                  >
                    {columns.map((column) => (
                      <td key={column.key} style={{ ...isAmc, minWidth: column.width, width: column.width }}>{formatValue(row, column.key)}</td>
                    ))}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="performance-empty">No tickets found for the selected filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="performance-pagination">
        <span>
          Page {page} of {Math.max(totalPages, 1)} · {total} records
        </span>
        <div>
          <button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange?.(page - 1)}>
            Previous
          </button>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => onPageChange?.(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default PerformanceTable;
