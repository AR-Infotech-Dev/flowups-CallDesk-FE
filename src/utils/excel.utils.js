export const EXCEL_CONTENT_TYPE = "application/vnd.ms-excel";

export const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const formatExcelLabel = (key = "") => String(key).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const buildBlankCells = (count = 0, className = "sheet-empty") => Array.from({ length: Math.max(Number(count) || 0, 0) }, () => `<td class="${className}">&nbsp;</td>`).join("");

export const buildSheetSpacerRow = (height = 20, spreadsheetColumnCount = 1) => `<tr style="height:${height}px;">${buildBlankCells(spreadsheetColumnCount)}</tr>`;

export function buildSideBySideRows({
  leftTitle = "Left",
  leftData = {},
  rightTitle = "Right",
  rightData = {},
  gapCols = 1,
  labelColspan = 2,
  valueColspan = 2,
} = {}) {
  const leftEntries = Object.entries(leftData || {});
  const rightEntries = Object.entries(rightData || {});
  const maxRows = Math.max(leftEntries.length, rightEntries.length);

  let html = `
    <tr>
      <td class="section-title-cell" colspan="${labelColspan + valueColspan}">
        ${escapeHtml(leftTitle)}
      </td>

      ${buildBlankCells(gapCols)}

      <td class="section-title-cell" colspan="${labelColspan + valueColspan}">
        ${escapeHtml(rightTitle)}
      </td>
    </tr>
  `;

  for (let index = 0; index < maxRows; index += 1) {
    const left = leftEntries[index];
    const right = rightEntries[index];

    html += `
      <tr>
        <td class="detail-label-cell" colspan="${labelColspan}">
          ${left ? escapeHtml(left[0]) : ""}
        </td>

        <td class="detail-value-cell" colspan="${valueColspan}">
          ${left ? escapeHtml(left[1]) : ""}
        </td>

        ${buildBlankCells(gapCols)}

        <td class="detail-label-cell" colspan="${labelColspan}">
          ${right ? escapeHtml(right[0]) : ""}
        </td>

        <td class="detail-value-cell" colspan="${valueColspan}">
          ${right ? escapeHtml(right[1]) : ""}
        </td>
      </tr>
    `;
  }

  return html;
}

export function buildExcelSummaryRows({
  summary = {},
  labels = {},
  tones = ["blue", "green", "orange"],
  spreadsheetColumnCount = 1,
  labelColspan = 2,
  valueColspan = 1,
} = {}) {
  const entries = Object.entries(summary || {});

  if (!entries.length) {
    return `
      <tr>
        <td class="summary-label-cell" colspan="${labelColspan}">Summary</td>
        <td class="summary-value-cell tone-slate-cell" colspan="${valueColspan}">No data</td>
        ${buildBlankCells(spreadsheetColumnCount - labelColspan - valueColspan)}
      </tr>
    `;
  }

  return entries.map(([key, value], index) => `
    <tr>
      <td class="summary-label-cell" colspan="${labelColspan}">${escapeHtml(labels[key] || formatExcelLabel(key))}</td>
      <td class="summary-value-cell tone-${tones[index % tones.length]}-cell" colspan="${valueColspan}">${escapeHtml(value)}</td>
      ${buildBlankCells(spreadsheetColumnCount - labelColspan - valueColspan)}
    </tr>
  `).join("");
}
export const excelFormat = (html) => {
  return `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    body {margin:0; background:#ffffff; color:#111827; font-family:Calibri,Arial,Helvetica,sans-serif; font-size:12px; }
                    .sheet {width:100%; border-collapse:collapse; table-layout:fixed; }
                    .sheet col.col-a {width:68px; }
                    .sheet col.col-b {width:110px; }
                    .sheet col.col-c {width:230px; }
                    .sheet col.col-d {width:145px; }
                    .sheet col.col-e {width:110px; }
                    .sheet col.col-f {width:115px; }
                    .sheet col.col-g {width:110px; }
                    .sheet col.col-h {width:140px; }
                    .sheet col.col-i {width:115px; }
                    .sheet col.col-j {width:130px; }
                    .sheet td, .sheet th {border:1px solid #d9e2ec; padding:5px 8px; vertical-align:middle; mso-number-format:"\\@"; }

                    .report-shell {max - width: 1280px;margin: 0 auto; border: 1px solid #dbeafe; border-radius: 22px; background: #ffffff; padding: 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);}
                    .report-header {border - radius:18px; background:linear-gradient(135deg,#082f5f 0%,#0f4c91 46%,#1d64c8 100%); color:#ffffff; padding:30px 34px; margin-bottom:22px; }
                    .eyebrow {margin:0 0 8px; color:#bfdbfe; font-size:11px; font-weight:800; letter-spacing:0.09em; text-transform:uppercase; }
                    .report-title {margin:0; font-size:30px; line-height:1.15; font-weight:850; }
                    .report-subtitle {margin:8px 0 0; color:#dbeafe; font-size:14px; }
                    .top-title {background:#174d80; color:#ffffff; font-size:22px; font-weight:700; text-align:center; height:38px; border-color:#174d80; }
                    .sub-title {background:#f8fbff; color:#31537a; font-weight:700; text-align:center; border-color:#d9e2ec; }
                    .section-title-cell {background:#235a84; color:#ffffff; font-size:15px; font-weight:700; text-align:center; border-color:#235a84; height:25px; }

                    .summary-label-cell,.detail-label-cell{background:#e8f1fb;color:#111827;font-weight:700;text-align:right;white-space:nowrap}
                    .summary-value-cell,.detail-value-cell{background:#ffffff;color:#111827;font-weight:700;text-align:center}
                    .tone-blue-cell{background:#dbeafe}
                    .tone-green-cell{background:#c8f7d4}
                    .tone-orange-cell{background:#fff0c2}
                    .tone-cyan-cell{background:#cffafe}
                    .tone-red-cell{background:#f4cccc}
                    .tone-violet-cell{background:#e9d5ff}
                    .tone-slate-cell{background:#e5e7eb}
                    .ticket-section-cell{background:#235a84;color:#ffffff;font-size:15px;font-weight:700;text-align:center;border-color:#235a84;height:25px}
                    .ticket-header-cell{background:#143a63;color:#ffffff;font-weight:700;text-align:center;border-color:#9fb7cc;height:24px}
                    .ticket-cell{background:#ffffff;color:#111827;text-align:center;height:22px}
                    .ticket-cell:nth-child(3){text - align:left}
                    .ticket-row-alt td{background:#f8fbff}
                    .excel-status-closed{background:#c8f7d4;color:#064e3b;font-weight:700}
                    .excel-status-open{background:#fff0c2;color:#92400e;font-weight:700}
                    .excel-status-progress{background:#dbeafe;color:#1d4ed8;font-weight:700}
                    .empty-ticket-cell{color:#64748b;text-align:center;padding:12px}
                    .text-center{text - align:center}
                </style>
            </head>
            <body>
                <table class="sheet">
                    <colgroup>
                        <col class="col-a" />
                        <col class="col-b" />
                        <col class="col-c" />
                        <col class="col-d" />
                        <col class="col-e" />
                        <col class="col-f" />
                        <col class="col-g" />
                        <col class="col-h" />
                        <col class="col-i" />
                        <col class="col-j" />
                    </colgroup>
                    <tbody>
                        ${html}
                    </tbody>
                </table>
            </body>
        </html>
    `
}
export const stripHtml = (value = "") => {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

