import { RotateCcw, Search, Download, FileText } from "lucide-react";

function PerformanceFilters({
  filters,
  users = [],
  companies = [],
  statuses = [],
  loading,
  exporting,
  canExport,
  onChange,
  onSearch,
  onReset,
  onExportExcel,
  onExportPdf,
}) {
  const updateField = (field, value) => {
    onChange?.({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="performance-filters">
      <div className="performance-filter-grid">
        <label className="performance-field">
          <span>User</span>
          <select value={filters.user_id || ""} onChange={(event) => updateField("user_id", event.target.value)}>
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.value} value={user.value}>
                {user.label}
              </option>
            ))}
          </select>
        </label>

        <label className="performance-field">
          <span>From Date</span>
          <input type="date" value={filters.from_date || ""} onChange={(event) => updateField("from_date", event.target.value)} />
        </label>

        <label className="performance-field">
          <span>To Date</span>
          <input type="date" value={filters.to_date || ""} onChange={(event) => updateField("to_date", event.target.value)} />
        </label>

        {/* <label className="performance-field">
          <span>Company</span>
          <select value={filters.company_id || ""} onChange={(event) => updateField("company_id", event.target.value)}>
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company.value} value={company.value}>
                {company.label}
              </option>
            ))}
          </select>
        </label> */}

        {/* <label className="performance-field">
          <span>Ticket Status</span>
          <select value={filters.ticket_status || ""} onChange={(event) => updateField("ticket_status", event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label> */}
      </div>

      <div className="performance-filter-actions">
        <button type="button" className="performance-button primary" disabled={loading} onClick={onSearch}>
          <Search size={14} />
          Search
        </button>
        <button type="button" className="performance-button" disabled={loading} onClick={onReset}>
          <RotateCcw size={14} />
          Reset
        </button>
        {/* <button type="button" className="performance-button" disabled={!canExport || exporting || loading} onClick={onExportExcel}> */}
        <button type="button" className="performance-button" disabled={!canExport || exporting || loading} onClick={onExportExcel}>
          <Download size={14} />
          Export Excel
        </button>
        {/* <button type="button" className="performance-button" disabled={!canExport || exporting || loading} onClick={onExportPdf}>
          <FileText size={14} />
          Export PDF
        </button> */}
      </div>
    </div>
  );
}

export default PerformanceFilters;
