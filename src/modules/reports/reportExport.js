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
  closed: "Closed Tickets",
  pending: "Pending Tickets",
  delegated: "Delegated Tickets",
  overdue: "Overdue Tickets",
  avg_resolution_time: "Average Resolution Time (hrs)",
  productivity_score: "Productivity Score",
};

function buildRowsHtml(tickets = []) {
  return tickets
    .map((ticket) => `
      <tr>
        ${ticketColumns.map(([, keys]) => `<td>${escapeHtml(getTicketValue(ticket, keys) || "-")}</td>`).join("")}
      </tr>
    `)
    .join("");
}

export function exportPerformanceExcel({ filters = {}, summary = {}, tickets = [], fileName = "performance-report" }) {
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #172033; }
          h2 { color: #003b7d; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #003b7d; color: #ffffff; border: 1px solid #003b7d; padding: 8px; text-align: left; }
          td { border: 1px solid #dbe3ef; padding: 8px; }
          tr:nth-child(even) td { background: #f8fbff; }
        </style>
      </head>
      <body>
        <h2>Performance Report</h2>
        <table>
          <tr><th>Filter</th><th>Value</th></tr>
          ${Object.entries(filters).map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value || "All")}</td></tr>`).join("")}
        </table>
        <br />
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          ${Object.entries(summary).map(([key, value]) => `<tr><td>${escapeHtml(summaryLabels[key] || key)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}
        </table>
        <br />
        <table>
          <tr>${ticketColumns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
          ${buildRowsHtml(tickets)}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// export function exportPerformancePdf({ filters = {}, summary = {}, tickets = [], user = {} }) {
//   const printWindow = window.open("", "_blank", "width=1100,height=800");
//   if (!printWindow) return false;

//   const userName = user.name || user.userName || user.email || "Selected User";
//   printWindow.document.write(`
//     <html>
//       <head>
//         <title>Performance Report</title>
//         <style>
//           body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
//           h1 { margin: 0 0 4px; font-size: 24px; }
//           h2 { margin: 22px 0 10px; font-size: 16px; }
//           .muted { color: #64748b; margin: 0 0 18px; }
//           .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
//           .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
//           .card span { display: block; color: #64748b; font-size: 11px; }
//           .card strong { font-size: 20px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
//           th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
//           th { background: #f8fafc; }
//         </style>
//       </head>
//       <body>
//         <h1>FlowupS CallDesk Performance Report</h1>
//         <p class="muted">${escapeHtml(userName)}</p>
//         <h2>Summary</h2>
//         <div class="cards">
//           ${Object.entries(summary).map(([key, value]) => `<div class="card"><span>${escapeHtml(summaryLabels[key] || key)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
//         </div>
//         <h2>Tickets</h2>
//         <table>
//           <tr>${ticketColumns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
//           ${buildRowsHtml(tickets)}
//         </table>
//       </body>
//     </html>
//   `);
//   printWindow.document.close();
//   printWindow.focus();
//   printWindow.print();
//   return true;
// }
export function exportPerformancePdf({
  filters = {},
  summary = {},
  tickets = [],
  user = {},
}) {

  const printWindow = window.open(
    "",
    "_blank",
    "width=1200,height=850"
  );

  if (!printWindow) return false;

  const userName =
    user.name ||
    user.userName ||
    user.email ||
    "Selected User";

  printWindow.document.write(`
    <html>

      <head>

        <title>Performance Report</title>

        <style>

          body{
            font-family:Arial,Helvetica,sans-serif;
            background:#f8fafc;
            color:#172033;
            margin:0;
            padding:24px;
          }

          .report-wrapper{
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:14px;
            padding:28px;
          }

          .report-header{
            margin-bottom:28px;
            text-align:center;
          }

          .report-title{
            font-size:30px;
            font-weight:700;
            color:#1e3a8a;
            margin-bottom:6px;
          }

          .report-subtitle{
            color:#64748b;
            font-size:14px;
          }

          .section-title{
            font-size:18px;
            font-weight:700;
            color:#0f172a;
            margin:28px 0 16px;
          }

          .summary-grid{
            width:100%;
            border-collapse:separate;
            border-spacing:12px;
          }

          .summary-card{
            border-radius:12px;
            padding:18px;
            border:1px solid #dbeafe;
            text-align:center;
          }

          .summary-label{
            font-size:12px;
            color:#64748b;
            margin-bottom:8px;
          }

          .summary-value{
            font-size:26px;
            font-weight:700;
          }

          .tone-blue{
            background:#eff6ff;
            color:#1d4ed8;
          }

          .tone-green{
            background:#ecfdf5;
            color:#15803d;
          }

          .tone-orange{
            background:#fff7ed;
            color:#c2410c;
          }

          .tone-red{
            background:#fef2f2;
            color:#dc2626;
          }

          .report-table{
            width:100%;
            border-collapse:collapse;
            margin-top:12px;
            font-size:13px;
          }

          .report-table th{
            background:#1e40af;
            color:#ffffff;
            border:1px solid #dbeafe;
            padding:12px;
            text-align:left;
            font-weight:600;
          }

          .report-table td{
            border:1px solid #e2e8f0;
            padding:10px 12px;
            vertical-align:top;
          }

          .report-table tr:nth-child(even) td{
            background:#f8fafc;
          }

          .footer-note{
            margin-top:28px;
            text-align:center;
            font-size:12px;
            color:#64748b;
          }

          .status-badge{
            display:inline-block;
            padding:4px 10px;
            border-radius:999px;
            font-size:11px;
            font-weight:700;
          }

          .status-open{
            background:#ffedd5;
            color:#9a3412;
          }

          .status-closed{
            background:#dcfce7;
            color:#166534;
          }

        </style>

      </head>

      <body>

        <div class="report-wrapper">

          <!-- HEADER -->
          <div class="report-header">

            <div class="report-title">
              FlowupS CallDesk Performance Report
            </div>

            <div class="report-subtitle">
              ${escapeHtml(userName)}
            </div>

          </div>

          <!-- SUMMARY -->
          <div class="section-title">
            Performance Summary
          </div>

          <table class="summary-grid">

            <tr>

              ${Object.entries(summary)
                .map(([key, value], index) => {

                  const tones = [
                    "tone-blue",
                    "tone-green",
                    "tone-orange",
                    "tone-red",
                  ];

                  return `
                    <td>

                      <div class="summary-card ${tones[index % tones.length]}">

                        <div class="summary-label">
                          ${escapeHtml(summaryLabels[key] || key)}
                        </div>

                        <div class="summary-value">
                          ${escapeHtml(value)}
                        </div>

                      </div>

                    </td>
                  `;
                })
                .join("")}

            </tr>

          </table>

          <!-- TICKETS -->
          <div class="section-title">
            Ticket Details
          </div>

          <table class="report-table">

            <tr>
              ${ticketColumns
                .map(
                  ([label]) => `
                    <th>
                      ${escapeHtml(label)}
                    </th>
                  `
                )
                .join("")}
            </tr>

            ${tickets.length
              ? tickets.map((ticket, index) => {

                  const status =
                    String(
                      ticket.ticket_status ||
                      ticket.status ||
                      ""
                    ).toLowerCase();

                  const statusClass =
                    status.includes("close") ||
                    status.includes("resolve")
                      ? "status-closed"
                      : "status-open";

                  return `
                    <tr>

                      ${ticketColumns.map(([, key]) => {

                        const value =
                          ticket[key] ?? "-";

                        if (
                          key === "ticket_status" ||
                          key === "status"
                        ) {
                          return `
                            <td>
                              <span class="status-badge ${statusClass}">
                                ${escapeHtml(value)}
                              </span>
                            </td>
                          `;
                        }

                        return `
                          <td>
                            ${escapeHtml(value)}
                          </td>
                        `;

                      }).join("")}

                    </tr>
                  `;

                }).join("")
              : `
                <tr>
                  <td colspan="${ticketColumns.length}"
                    style="text-align:center;padding:18px;">
                    No tickets found.
                  </td>
                </tr>
              `
            }

          </table>

          <!-- FOOTER -->
          <div class="footer-note">
            This is a system generated performance report.
          </div>

        </div>

      </body>

    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  return true;
}

