import { formatReportDate, stripReportHtml } from "../report.utils";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getTicketValue = (ticket = {}, keys = []) => {
  const key = keys.find((item) => ticket[item] !== undefined && ticket[item] !== null && ticket[item] !== "");
  return key ? ticket[key] : "";
};

const formatFilterLabel = (key = "") =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const ticketColumns = [
  ["Ticket Number", ["ticket_no", "ticketNo", "ticket_number", "ticket_id"]],
  ["Customer Name", ["customer_name", "customerName", "client_name", "client_id", "name"]],
  ["Priority", ["priority_name", "ticket_priority_name", "ticket_priority", "priority"]],
  ["Ticket Status", ["status_name", "ticket_status_name", "ticket_status", "status"]],
  ["Assigned Date", ["assigned_date", "created_date", "start_date"]],
  ["Due Date", ["due_date", "dueDate"]],
  ["Resolution Time", ["resolution_time", "resolutionTime", "resolve_time"]],
];

const summaryLabels = {
  assigned: "Total Assigned Tickets",
  generated: "Generated Tickets",
  closed: "Closed Tickets",
  pending: "Pending Tickets",
  delegated: "Delegated Tickets",
  overdue: "Overdue Tickets",
  avg_resolution_time: "Average Resolution Time (hrs)",
  productivity_score: "Productivity Score",
};

const summaryTones = ["blue", "green", "orange", "cyan", "red", "violet", "slate"];

function getStatusClass(value = "") {
  const status = String(value || "").toLowerCase();
  if (status.includes("closed") || status.includes("resolved") || status === "208") return "status-closed";
  if (status.includes("progress")) return "status-progress";
  return "status-open";
}

function buildSummaryCards(summary = {}) {
  const entries = Object.entries(summary);
  if (!entries.length) {
    return `<div class="empty-card">No summary data available.</div>`;
  }

  return entries
    .map(([key, value], index) => `
      <article class="summary-card tone-${summaryTones[index % summaryTones.length]}">
        <div class="summary-value">${escapeHtml(value)}</div>
        <div class="summary-label">${escapeHtml(summaryLabels[key] || formatFilterLabel(key))}</div>
      </article>
    `)
    .join("");
}

function buildDetailsRows({ filters = {}, user = {}, tickets = [] }) {
  const details = [
    ["User / Company", user.name || user.userName || user.email || filters.user_name || "Selected User"],
    ["From Date", filters.from_date ? formatReportDate(filters.from_date) : "All"],
    ["To Date", filters.to_date ? formatReportDate(filters.to_date) : "All"],
    ["Records", tickets.length],
    ["Generated On", formatReportDate(new Date())],
  ];

  Object.entries(filters)
    .filter(([key]) => !["user_id", "user_name", "from_date", "to_date"].includes(key))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        details.push([formatFilterLabel(key), value]);
      }
    });

  return details
    .map(([label, value]) => `
      <tr>
        <td class="details-label">${escapeHtml(label)}</td>
        <td class="details-value">${escapeHtml(value || "-")}</td>
      </tr>
    `)
    .join("");
}

function buildRowsHtml(tickets = []) {
  if (!tickets.length) {
    return `
      <tr>
        <td colspan="${ticketColumns.length}" class="empty-row">No tickets found for this report.</td>
      </tr>
    `;
  }

  return tickets
    .map((ticket) => `
      <tr>
        ${ticketColumns.map(([label, keys]) => {
      const rawValue = getTicketValue(ticket, keys) || "-";
      const value = label.toLowerCase().includes("date") ? formatReportDate(rawValue) : stripReportHtml(rawValue);

      if (label === "Ticket Status") {
        return `
              <td>
                <span class="status-badge ${getStatusClass(rawValue)}">${escapeHtml(value)}</span>
              </td>
            `;
      }

      return `<td>${escapeHtml(value)}</td>`;
    }).join("")}
      </tr>
    `)
    .join("");
}

function buildPerformanceReportHtml({ filters = {}, summary = {}, tickets = [], user = {}, printable = false }) {
  const userName = user.name || user.userName || user.email || filters.user_name || "Selected User";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Performance Report</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            background: #eef4fb;
            color: #172033;
            font-family: Inter, "Segoe UI", Roboto, Arial, Helvetica, sans-serif;
            font-size: 13px;
          }
          .report-shell {
            max-width: 1280px;
            margin: 0 auto;
            border: 1px solid #dbeafe;
            border-radius: 22px;
            background: #ffffff;
            padding: 24px;
            box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
          }
          .report-header {
            border-radius: 18px;
            background: linear-gradient(135deg, #082f5f 0%, #0f4c91 46%, #1d64c8 100%);
            color: #ffffff;
            padding: 30px 34px;
            margin-bottom: 22px;
          }
          .eyebrow {
            margin: 0 0 8px;
            color: #bfdbfe;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.09em;
            text-transform: uppercase;
          }
          .report-title {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
            font-weight: 850;
          }
          .report-subtitle {
            margin: 8px 0 0;
            color: #dbeafe;
            font-size: 14px;
          }
          .dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(330px, 0.75fr);
            gap: 18px;
            margin-bottom: 22px;
          }
          .panel {
            border: 1px solid #dbeafe;
            border-radius: 16px;
            background: #ffffff;
            padding: 18px;
          }
          .panel-title {
            margin: 0 0 14px;
            color: #0f172a;
            font-size: 16px;
            font-weight: 850;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .summary-card {
            min-height: 96px;
            border: 1px solid transparent;
            border-radius: 15px;
            padding: 18px;
          }
          .summary-value {
            color: #0f172a;
            font-size: 30px;
            line-height: 1;
            font-weight: 900;
          }
          .summary-label {
            margin-top: 9px;
            color: #64748b;
            font-size: 12px;
            font-weight: 750;
          }
          .tone-blue { background: #eff6ff; border-color: #bfdbfe; }
          .tone-green { background: #ecfdf5; border-color: #bbf7d0; }
          .tone-orange { background: #fff7ed; border-color: #fed7aa; }
          .tone-cyan { background: #ecfeff; border-color: #a5f3fc; }
          .tone-red { background: #fef2f2; border-color: #fecaca; }
          .tone-violet { background: #f5f3ff; border-color: #ddd6fe; }
          .tone-slate { background: #f8fafc; border-color: #e2e8f0; }
          .details-table {
            width: 100%;
            overflow: hidden;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #dbeafe;
            border-radius: 13px;
          }
          .details-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 13px;
          }
          .details-table tr:last-child td { border-bottom: 0; }
          .details-label {
            width: 42%;
            background: #eff6ff;
            color: #31537a;
            font-weight: 800;
          }
          .details-value {
            background: #ffffff;
            color: #0f172a;
            font-weight: 700;
          }
          .table-panel {
            border: 1px solid #dbeafe;
            border-radius: 16px;
            background: #ffffff;
            padding: 18px;
          }
          .table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #dbeafe;
            border-radius: 14px;
          }
          .report-table {
            width: 100%;
            min-width: 980px;
            border-collapse: separate;
            border-spacing: 0;
          }
          .report-table th {
            position: sticky;
            top: 0;
            background: #0b376d;
            color: #ffffff;
            border-right: 1px solid rgba(255, 255, 255, 0.16);
            padding: 13px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 850;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .report-table th:last-child { border-right: 0; }
          .report-table td {
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 12px;
            color: #334155;
            vertical-align: top;
          }
          .report-table td:last-child { border-right: 0; }
          .report-table tr:nth-child(even) td { background: #f8fbff; }
          .report-table tr:hover td { background: #eef6ff; }
          .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 11px;
            font-weight: 850;
            white-space: nowrap;
          }
          .status-closed { background: #dcfce7; color: #166534; }
          .status-open { background: #ffedd5; color: #9a3412; }
          .status-progress { background: #dbeafe; color: #1d4ed8; }
          .empty-row {
            padding: 26px !important;
            text-align: center;
            color: #64748b;
          }
          .footer-note {
            margin-top: 18px;
            color: #64748b;
            font-size: 11px;
            text-align: center;
          }
          @media (max-width: 900px) {
            .dashboard-grid { grid-template-columns: 1fr; }
          }
          @media print {
            body {
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-shell {
              max-width: none;
              border: 0;
              border-radius: 0;
              box-shadow: none;
              padding: 14px;
            }
            .report-header { break-inside: avoid; }
            .dashboard-grid {
              grid-template-columns: 1.25fr 0.75fr;
              break-inside: avoid;
            }
            .table-wrap { overflow: visible; }
            .report-table {
              min-width: 0;
              font-size: 11px;
            }
            .report-table th,
            .report-table td {
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <main class="report-shell">
          <header class="report-header">
            <p class="eyebrow">Premium SaaS Analytics</p>
            <h1 class="report-title">FlowupS CallDesk Performance Report</h1>
            <p class="report-subtitle">${escapeHtml(userName)}${printable ? " | Printable Report" : " | Excel Dashboard Report"}</p>
          </header>

          <section class="dashboard-grid">
            <div class="panel">
              <h2 class="panel-title">Performance Summary</h2>
              <div class="summary-grid">${buildSummaryCards(summary)}</div>
            </div>

            <div class="panel">
              <h2 class="panel-title">Report Details</h2>
              <table class="details-table">
                ${buildDetailsRows({ filters, user, tickets })}
              </table>
            </div>
          </section>

          <section class="table-panel">
            <h2 class="panel-title">Ticket Details</h2>
            <div class="table-wrap">
              <table class="report-table">
                <thead>
                  <tr>${ticketColumns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
                </thead>
                <tbody>${buildRowsHtml(tickets)}</tbody>
              </table>
            </div>
          </section>

          <div class="footer-note">This is a system generated performance report.</div>
        </main>
      </body>
    </html>
  `;
}

export function exportPerformancePdf({ filters = {}, summary = {}, tickets = [], user = {} }) {
  const printWindow = window.open("", "_blank", "width=1400,height=900");
  if (!printWindow) return false;

  printWindow.document.write(buildPerformanceReportHtml({ filters, summary, tickets, user, printable: true }));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
