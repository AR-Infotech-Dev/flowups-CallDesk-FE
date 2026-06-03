import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Download, Send, FileBarChart, Search, Ticket, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
const EMPTY_REPORT = {
    customer: {},
    summary: {},
    products: [],
    tickets: [],
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

function stripHtml(value = "") {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getTicketDate(ticket = {}) {
    return ticket.start_date || ticket.created_date || ticket.createdAt || ticket.assigned_date || ticket.due_date || "";
}

function getTicketStatus(ticket = {}) {
    return ticket.status_name || ticket.ticket_status_name || ticket.ticket_status || ticket.status || "-";
}

function isClosedTicket(ticket = {}) {
    const status = String(getTicketStatus(ticket)).toLowerCase();
    return status.includes("closed") || status.includes("resolved") || status === "208";
}

function isOverdueTicket(ticket = {}) {
    if (isClosedTicket(ticket)) return false;
    const dueDate = ticket.due_date ? new Date(ticket.due_date) : null;
    if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function normalizeCustomerProducts(customer = {}) {
    const rows = customer.customer_products || customer.products || [];
    if (!Array.isArray(rows)) return [];
    return rows
        .map((row) => ({
            product_id: row?.product_id || "",
            product_name: row?.product_name || "",
            serial_number: row?.serial_number || row?.product_serial_number || "",
        }))
        .filter((row) => row.product_id || row.product_name || row.serial_number);
}

function exportCustomerReportExcel({ customer = {}, summary = {}, products = [], tickets = [], fromDate = "" }) {
    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #172033; }
          h2 { color: #003b7d; margin-bottom: 4px; }
          h3 { color: #172033; margin-top: 18px; }
          .muted { color: #64748b; font-size: 12px; margin-top: 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th { background: #003b7d; color: #ffffff; border: 1px solid #003b7d; padding: 8px; text-align: left; }
          td { border: 1px solid #dbe3ef; padding: 8px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fbff; }
        </style>
      </head>
      <body>
        <h2>Customer Ticket Report</h2>
        <p class="muted">From ${escapeHtml(formatDate(fromDate))}</p>

        <h3>Customer Details</h3>
        <table>
          <tr><th>Customer Name</th><td>${escapeHtml(customer.name || "-")}</td></tr>
          <tr><th>Company</th><td>${escapeHtml(customer.company_name || customer.billing_name || "-")}</td></tr>
          <tr><th>Email</th><td>${escapeHtml(customer.email || "-")}</td></tr>
          <tr><th>Mobile</th><td>${escapeHtml(customer.mobile_no || "-")}</td></tr>
          <tr><th>Contact Person</th><td>${escapeHtml(customer.contact_person || "-")}</td></tr>
          <tr><th>AMC End Date</th><td>${escapeHtml(formatDate(customer.amc_end_date))}</td></tr>
        </table>

        <h3>Products</h3>
        <table>
          <tr><th>Product</th><th>Serial Number</th></tr>
          ${products.length ? products.map((product) => `
            <tr>
              <td>${escapeHtml(product.product_name || "-")}</td>
              <td>${escapeHtml(product.serial_number || "-")}</td>
            </tr>
          `).join("") : `<tr><td colspan="2">No products assigned.</td></tr>`}
        </table>

        <h3>Summary</h3>
        <table>
          <tr><th>Total Tickets</th><td>${escapeHtml(summary.total || 0)}</td></tr>
          <tr><th>Resolved</th><td>${escapeHtml(summary.resolved || summary.closed || 0)}</td></tr>
          <tr><th>Pending</th><td>${escapeHtml(summary.pending || 0)}</td></tr>
          <tr><th>Overdue</th><td>${escapeHtml(summary.overdue || 0)}</td></tr>
        </table>

        <h3>Tickets</h3>
        <table>
          <tr>
            <th>Ticket No</th>
            <th>Description</th>
            <th>Query Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Product</th>
            <th>Start Date</th>
            <th>Due Date</th>
            <th>Resolution Time</th>
          </tr>
          ${tickets.map((ticket) => `
            <tr>
              <td>${escapeHtml(ticket.ticket_no || ticket.ticket_id || "-")}</td>
              <td>${escapeHtml(stripHtml(ticket.description || ticket.title || "-"))}</td>
              <td>${escapeHtml(ticket.query_type || "-")}</td>
              <td>${escapeHtml(getTicketStatus(ticket))}</td>
              <td>${escapeHtml(ticket.priority_name || ticket.ticket_priority_name || ticket.ticket_priority || ticket.priority || "-")}</td>
              <td>${escapeHtml(ticket.assignee_name || "-")}</td>
              <td>${ticket?.product_name ? `${ticket.product_name}${ticket?.product_serial_number ? ` - ${ticket.product_serial_number}` : ""}` : "-"}</td >
              <td>${escapeHtml(formatDate(ticket.start_date || ticket.created_date))}</td>
              <td>${escapeHtml(formatDate(ticket.due_date))}</td>
              <td>${escapeHtml(ticket.resolution_time !== "" && ticket.resolution_time !== undefined ? `${ticket.resolution_time} hrs` : "-")}</td>
            </tr >
    `).join("")}
        </table>
      </body>
    </html>
  `;

    const fileCustomer = String(customer.name || customer.customer_id || "customer").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer-report-${fileCustomer || "customer"}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, icon: Icon, tone = "blue" }) {
    return (
        <article className={`customer-report-card customer-report-${tone}`}>
            <span className="customer-report-card-icon">
                <Icon size={15} />
            </span>
            <div>
                <p>{label}</p>
                <strong>{value ?? 0}</strong>
            </div>
        </article>
    );
}

function InfoItem({ label, value }) {
    return (
        <div className="customer-report-info-item">
            <span>{label}</span>
            <strong>{value || "-"}</strong>
        </div>
    );
}

function CustomerReport({ customerId: providedCustomerId }) {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const customerId = providedCustomerId || params.customerId;
    const routeCustomer = location.state?.customer || {};
    const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date()));
    const [report, setReport] = useState(() => ({
        ...EMPTY_REPORT,
        customer: routeCustomer,
    }));
    const [loading, setLoading] = useState(false);
    const [generatedFromDate, setGeneratedFromDate] = useState("");

    const products = useMemo(() => normalizeCustomerProducts(report.customer), [report.customer]);
    const reportProducts = report.products?.length ? report.products : products;

    const summary = report.summary || {};

    const handleGenerate = async () => {
        if (!customerId) {
            toast.error("Customer id not found.");
            return;
        }
        if (!fromDate) {
            toast.error("Please select report date.");
            return;
        }

        setLoading(true);
        const res = await makeRequest("/reports/customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: {
                customer_id: customerId,
                from_date: fromDate,
            },
        });
        setLoading(false);

        if (!res?.success) {
            toast.error(res?.message || "Unable to generate customer report.");
            return;
        }

        const data = res.data || {};
        setReport({
            customer: data.customer || routeCustomer,
            products: data.products || data.customer?.customer_products || [],
            summary: data.summary || {},
            tickets: data.tickets || [],
        });
        setGeneratedFromDate(data.filters?.from_date || fromDate);
    };

    const handleExportExcel = () => {
        if (!report.tickets.length) {
            toast.error("No report data available to export.");
            return;
        }

        exportCustomerReportExcel({
            customer: report.customer,
            summary,
            products: report.products?.length ? report.products : products,
            tickets: report.tickets,
            fromDate: generatedFromDate || fromDate,
        });
    };
    const handleSendReport = async () => {
        try {
            setLoading(true);
            const res = await makeRequest('/reports/sendReport', {
                method: "POST",
                body: {
                    customer_id: customerId,
                    from_date: generatedFromDate || fromDate,
                },
            });
            if (res.success) {
                toast.success(res?.message);
                return;
            }
            toast.error(res?.msg || res?.message || "Something went wrong");
        } catch (error) {
            toast.error(error.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            handleGenerate();
        }
    }, [customerId]);

    return (
        <section className="customer-report-page">
            <div className="customer-report-header">
                <button type="button" className="customer-report-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={15} />
                    Back
                </button>
                <div>
                    <h2>Customer Ticket Report</h2>
                    <p>Select a date and generate ticket support report from that date onward.</p>
                </div>
            </div>

            <div className="customer-report-toolbar">
                <label className="customer-report-date-field">
                    <span>Report From Date</span>
                    <div>
                        <CalendarDays size={14} />
                        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                    </div>
                </label>
                <button type="button" className="customer-report-generate" disabled={loading} onClick={handleGenerate}>
                    <Search size={14} />
                    {loading ? "Generating..." : "Generate Report"}
                </button>
                <button type="button" className="customer-report-export" disabled={loading || !report.tickets.length} onClick={handleExportExcel}>
                    <Download size={14} />
                    Export Excel
                </button>
                <button type="button" className="customer-report-export" disabled={loading || !report.tickets.length} onClick={handleSendReport}>
                    <Send size={14} />
                    Send Report to Customer
                </button>
            </div>

            <div className="customer-report-scroll">
                <section className="customer-report-customer-card">
                    <div className="customer-report-customer-title">
                        <span className="customer-report-avatar">{String(report.customer?.name || "?").charAt(0)}</span>
                        <div>
                            <h3>{report.customer?.name || `Customer #${customerId || "-"}`}</h3>
                            <p>{report.customer?.company_name || report.customer?.billing_name || "Customer"}</p>
                        </div>
                    </div>
                    <span className={`customer-report-amc ${String(report.customer?.is_amc || "").toLowerCase() === "yes" ? "active" : ""}`}>
                        {String(report.customer?.is_amc || "").toLowerCase() === "yes" ? "AMC Customer" : "Non AMC"}
                    </span>
                </section>

                <section className="customer-report-info-grid">
                    <InfoItem label="Email" value={report.customer?.email} />
                    <InfoItem label="Mobile" value={report.customer?.mobile_no} />
                    <InfoItem label="Contact Person" value={report.customer?.contact_person} />
                    <InfoItem label="AMC End Date" value={formatDate(report.customer?.amc_end_date)} />
                </section>

                <section className="customer-report-summary">
                    <SummaryCard label="Total Tickets" value={summary.total} icon={Ticket} />
                    <SummaryCard label="Resolved" value={summary.resolved ?? summary.closed} icon={CheckCircle2} tone="green" />
                    <SummaryCard label="Pending" value={summary.pending} icon={Clock3} tone="amber" />
                    <SummaryCard label="Overdue" value={summary.overdue} icon={TriangleAlert} tone="red" />
                </section>

                <section className="customer-report-panel">
                    <div className="customer-report-panel-head">
                        <div>
                            <span>Tickets</span>
                            <h3>Ticket Support Report</h3>
                        </div>
                        <p>From {generatedFromDate ? formatDate(generatedFromDate) : "-"}</p>
                    </div>
                    <div className="customer-report-table-wrap">
                        <table className="customer-report-table">
                            <thead>
                                <tr>
                                    <th>Ticket No</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Product</th>
                                    <th>Start Date</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.tickets.length ? (
                                    report.tickets.map((ticket, index) => (
                                        <tr key={ticket.ticket_id || ticket.ticketID || ticket.ticket_no || index}>
                                            <td>{ticket.ticket_no || ticket.ticket_id || "-"}</td>
                                            <td>{stripHtml(ticket.description || ticket.title || "-")}</td>
                                            <td>{getTicketStatus(ticket)}</td>
                                            <td>{ticket.priority_name || ticket.ticket_priority_name || ticket.ticket_priority || ticket.priority || "-"}</td>
                                            {/* <td>{`${ticket.priority_name ? ticket.priority_name + '-' + ticket.priority_name : '-'}`}</td> */}
                                            <td> {ticket?.product_name ? `${ticket.product_name}${ticket?.product_serial_number ? ` - ${ticket.product_serial_number}` : ""}` : "-"}</td>
                                            <td>{formatDate(ticket.start_date || ticket.created_date)}</td>
                                            <td>{formatDate(ticket.due_date)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="customer-report-empty">
                                                <FileBarChart size={22} />
                                                <span>No tickets found from selected date.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="customer-report-panel">
                    <div className="customer-report-panel-head">
                        <div>
                            <span>Products</span>
                            <h3>Customer Products</h3>
                        </div>
                        <p>{reportProducts.length} items</p>
                    </div>
                    <div className="customer-report-products">
                        {reportProducts.length ? (
                            reportProducts.map((product, index) => (
                                <article key={`${product.product_id || index}-${product.serial_number || index}`}>
                                    <strong>{product.product_name || "Unnamed Product"}</strong>
                                    <span>Serial No: {product.serial_number || "-"}</span>
                                </article>
                            ))
                        ) : (
                            <div className="customer-report-empty">No products assigned.</div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}

export default CustomerReport;
