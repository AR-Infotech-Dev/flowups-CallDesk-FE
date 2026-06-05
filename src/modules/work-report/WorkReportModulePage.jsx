import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Building2, Clock, FileText, Ticket, Users } from "lucide-react";
import { makeRequest } from "../../api/httpClient";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import { fetchReportCompanies, fetchReportUsers } from "../reports/performance.service";
import "./work-report.css";

const defaultFilters = {
  user_id: "",
  company_id: "",
  from_date: "",
  to_date: "",
};

function formatMinutes(value = 0) {
  const minutes = Number(value || 0);
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : "", mins ? `${mins}m` : ""].filter(Boolean).join(" ");
}

function WorkReportModulePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [companySummary, setCompanySummary] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "work_start_at", direction: "DESC" });

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      const [nextUsers, nextCompanies] = await Promise.all([
        fetchReportUsers(),
        fetchReportCompanies(),
      ]);
      if (!isMounted) return;
      setUsers(nextUsers);
      setCompanies(nextCompanies);
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const res = await makeRequest("/reports/work-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...appliedFilters,
        page,
        limit: 10,
        searchText: debouncedSearchText,
        order_by: sortConfig.key,
        order: sortConfig.direction,
      }),
    });
    setLoading(false);

    if (!res?.success) {
      toast.error(res?.message || "Unable to load work report");
      return;
    }

    setRows(res.data || []);
    setSummary(res.summary || {});
    setCompanySummary(res.company_summary || []);
    setPagination(res.pagination || {});
  }, [appliedFilters, debouncedSearchText, page, sortConfig]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSearchText("");
    setPage(1);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "ASC" ? "DESC" : "ASC",
    }));
  };

  const summaryCards = useMemo(() => [
    { label: "Total Logs", value: summary.total_logs || 0, icon: FileText },
    { label: "Total Time", value: formatMinutes(summary.total_minutes), icon: Clock },
    { label: "Employees", value: summary.employee_count || 0, icon: Users },
    { label: "Tickets", value: summary.ticket_count || 0, icon: Ticket },
  ], [summary]);

  return (
    <ModulePageLayout
      title="Work Report"
      description="View company-wise ticket work logs and employee effort."
      table={
        <div className="work-report-page">
          <div className="work-report-filters">
            <div className="work-report-filter-grid">
              <SelectField label="Employee" value={filters.user_id} options={users} onChange={(value) => setFilters((current) => ({ ...current, user_id: value }))} />
              <SelectField label="Company" value={filters.company_id} options={companies} onChange={(value) => setFilters((current) => ({ ...current, company_id: value }))} />
              <InputField label="From Date" type="date" value={filters.from_date} onChange={(value) => setFilters((current) => ({ ...current, from_date: value }))} />
              <InputField label="To Date" type="date" value={filters.to_date} onChange={(value) => setFilters((current) => ({ ...current, to_date: value }))} />
            </div>
            <div className="work-report-search-row">
              <input
                value={searchText}
                onChange={(event) => {
                  setPage(1);
                  setSearchText(event.target.value);
                }}
                placeholder="Search ticket, client, employee, work details"
                className="work-report-search"
              />
              <div className="work-report-actions">
                <button type="button" onClick={handleSearch} className="work-report-button primary">Apply</button>
                <button type="button" onClick={handleReset} className="work-report-button">Reset</button>
              </div>
            </div>
          </div>

          <div className="work-report-summary-grid">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </div>

          {companySummary.length ? (
            <div className="work-report-panel">
              <div className="work-report-panel-title">
                <Building2 size={15} />
                Company Summary
              </div>
              <div className="work-report-company-grid">
                {companySummary.map((item) => (
                  <div key={item.company_id || item.company_name} className="work-report-company-card">
                    <p>{item.company_name || "-"}</p>
                    <strong>{formatMinutes(item.total_minutes)} <span>({item.total_logs} logs)</span></strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <WorkReportTable rows={rows} loading={loading} sortConfig={sortConfig} onSort={handleSort} />
          <ModulePagination pagination={pagination} onPageChange={setPage} />
        </div>
      }
    />
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="work-report-summary-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <Icon size={17} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="work-report-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, type, value, onChange }) {
  return (
    <label className="work-report-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function WorkReportTable({ rows, loading, sortConfig, onSort }) {
  const headers = [
    ["work_start_at", "Date / Time"],
    ["employee_name", "Employee"],
    ["ticket_no", "Ticket"],
    ["client_name", "Client"],
    ["company_name", "Company"],
    ["spent_minutes", "Spent"],
    ["work_details", "Work Details"],
  ];

  if (loading) {
    return <div className="work-report-empty">Loading work report...</div>;
  }

  return (
    <div className="work-report-table-panel">
      <div className="work-report-table-scroll">
        <table className="work-report-table">
          <thead>
            <tr>
              {headers.map(([key, label]) => (
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
                <td colSpan={headers.length} className="work-report-empty-cell">No work logs found</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.work_log_id}>
                <td>{row.work_date}<br /><span>{row.work_time}</span></td>
                <td><strong>{row.employee_name || "-"}</strong></td>
                <td>{row.ticket_no || "-"}</td>
                <td>{row.client_name || "-"}</td>
                <td>{row.company_name || "-"}</td>
                <td><strong>{formatMinutes(row.spent_minutes)}</strong></td>
                <td className="work-report-details">{row.work_details || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkReportModulePage;
