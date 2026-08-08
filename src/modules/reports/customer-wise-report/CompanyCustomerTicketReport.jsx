import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, Download, RotateCcw, Search, Ticket, TriangleAlert, UserCheck, Users } from "lucide-react";
import { toast } from "react-toastify";
import ModulePagination from "../../shared/ModulePagination";
import { getCurrentSession } from "../../../auth/utils/authStorage";
import { fetchReportCompanies } from "../performance-report/data/performance.service";
import { fetchCompanyCustomerTicketReport, downloadCustomerWiseReport } from "./companyCustomerReport.service";
import { formatReportDate, toReportDateInput } from "../report.utils";
import "./company-customer-report.css";
import { useAuth } from "@/auth/components/AuthProvider";
const getDefaultFilters = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const user = getCurrentSession()?.user || {};
  return {
    company_id: String(user.company_id || ""),
    from_date: toReportDateInput(monthStart),
    to_date: toReportDateInput(today),
    searchText: "",
  };
};

const EMPTY_REPORT = {
  company: {},
  summary: {},
  customers: [],
  pagination: {},
};

const isAmcCustomer = (value) => ["1", "true", "y", "yes"].includes(String(value || "").toLowerCase());

const summaryItems = [
  { key: "total_customers", label: "Total Customers", icon: Users, tone: "blue" },
  { key: "customers_with_tickets", label: "With Tickets", icon: UserCheck, tone: "cyan" },
  { key: "customers_without_tickets", label: "Without Tickets", icon: Users, tone: "slate" },
  { key: "total_tickets", label: "Total Tickets", icon: Ticket, tone: "violet" },
  { key: "open_tickets", label: "Open", icon: Clock3, tone: "amber" },
  { key: "in_progress_tickets", label: "In Progress", icon: Clock3, tone: "blue" },
  { key: "closed_tickets", label: "Closed", icon: CheckCircle2, tone: "green" },
  { key: "overdue_tickets", label: "Overdue", icon: TriangleAlert, tone: "red" },
];

function CompanyCustomerTicketReport() {
  const { authSession } = useAuth();
  const roleSlug = authSession?.user?.role_slug;
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((item) => String(item.value) === String(filters.company_id)),
    [companies, filters.company_id]
  );

  useEffect(() => {
    let mounted = true;
    fetchReportCompanies().then(
      (items) => {
        if (!mounted) return;
        const user = getCurrentSession()?.user || {};
        const isSuperAdmin = user.role_slug === "super_admin";
        const scopedItems = isSuperAdmin
          ? items
          : items.filter((item) => String(item.value) === String(user.company_id || ""));
        const visibleItems = scopedItems.length
          ? scopedItems
          : user.company_id
            ? [{ value: String(user.company_id), label: user.company_name || "My Company" }]
            : [];
        setCompanies(visibleItems);
        setFilters((current) => ({
          ...current,
          company_id: current.company_id || (visibleItems.length === 1 ? visibleItems[0].value : ""),
        }));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadReport = async (nextFilters = appliedFilters, page = 1) => {
    if (!nextFilters.company_id) {
      toast.error("Please select a company.");
      return;
    }

    setLoading(true);
    const response = await fetchCompanyCustomerTicketReport(nextFilters, page);
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
  const handleExport = () => {
    downloadCustomerWiseReport(filters);
  }
  const resetReport = () => {
    const nextFilters = getDefaultFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setReport(EMPTY_REPORT);
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="company-ticket-report-page">
      <header className="company-ticket-report-header">
        <div>
          <span>Company Report</span>
          <h2>Customer Ticket Summary</h2>
          <p>Customer-wise ticket counts for the selected company and period.</p>
        </div>
        <div className="company-ticket-report-company">
          <Building2 size={16} />
          <span>{report.company?.company_name || selectedCompany?.label || "Select company"}</span>
        </div>
      </header>

      <div className="company-ticket-report-filters">
        <label>
          <span>Company</span>
          <select value={filters.company_id} onChange={(event) => updateFilter("company_id", event.target.value)}>
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.value} value={company.value}>{company.label}</option>
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
        <label className="company-ticket-report-search">
          <span>Customer</span>
          <input
            type="search"
            value={filters.searchText}
            placeholder="Name, email or mobile"
            onChange={(event) => updateFilter("searchText", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") generateReport();
            }}
          />
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
          <button type="button" className="" disabled={loading} title="Export" onClick={handleExport}>
            <Download size={14} />Export Excel
          </button>
        </div>
      </div>

      <div className="company-ticket-report-scroll">
        <section className="company-ticket-report-summary">
          {summaryItems.map(({ key, label, icon: Icon, tone }) => (
            <article key={key} className={`company-ticket-summary-card ${tone}`}>
              <span><Icon size={15} /></span>
              <div>
                <small>{label}</small>
                <strong>{Number(report.summary?.[key] || 0)}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="company-ticket-report-panel">
          <div className="company-ticket-report-panel-head">
            <div>
              <span>Customers</span>
              <h3>Ticket Count Breakdown</h3>
            </div>
            <p>{report.pagination?.total || 0} customers</p>
          </div>

          <div className="company-ticket-report-table-wrap">
            <table className="company-ticket-report-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Total</th>
                  <th>Open</th>
                  <th>In Progress</th>
                  <th>Closed</th>
                  <th>Overdue</th>
                  <th>Last Ticket</th>
                </tr>
              </thead>
              <tbody>
                {report.customers.length ? report.customers.map((customer) => (
                  <tr key={customer.customer_id}>
                    <td>
                      <strong>{customer.customer_name || "-"}</strong>
                      <small>{isAmcCustomer(customer.is_amc) ? "AMC" : "Non AMC"}</small>
                    </td>
                    <td>
                      <span>{customer.contact_person || "-"}</span>
                      <small>{customer.mobile_no || customer.email || "-"}</small>
                    </td>
                    <td><b>{Number(customer.total_tickets || 0)}</b></td>
                    <td>{Number(customer.open_tickets || 0)}</td>
                    <td>{Number(customer.in_progress_tickets || 0)}</td>
                    <td>{Number(customer.closed_tickets || 0)}</td>
                    <td className={Number(customer.overdue_tickets || 0) > 0 ? "is-overdue" : ""}>{Number(customer.overdue_tickets || 0)}</td>
                    <td>
                      <span>{customer.last_ticket_no || "-"}</span>
                      <small>
                        {[customer.last_ticket_status, formatReportDate(customer.last_ticket_date)].filter((value) => value && value !== "-").join(" | ") || "-"}
                      </small>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="company-ticket-report-empty">
                      {loading ? "Loading customer report..." : "Generate the report to view customer ticket counts."}
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

export default CompanyCustomerTicketReport;
