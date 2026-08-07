import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

function AttendanceMatrixControls({ filters, companies, isSuperAdmin, loading, monthLabel, onChange, onMonthChange, onGenerate, onExport, exportDisabled = false }) {
  return (
    <div className="uwa-controls">
      <div className="uwa-month-nav">
        <button type="button" onClick={() => onMonthChange(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <strong>{monthLabel}</strong>
        <button type="button" onClick={() => onMonthChange(1)} aria-label="Next month"><ChevronRight size={16} /></button>
      </div>
      <div className="uwa-filter-fields">
        {isSuperAdmin ? (
          <select value={filters.company_id} onChange={(event) => onChange("company_id", event.target.value)}>
            <option value="">Select company</option>
            {companies.map((company) => <option key={company.value} value={company.value}>{company.label}</option>)}
          </select>
        ) : null}
        <label className="uwa-search"><Search size={16} /><input value={filters.searchText} onChange={(event) => onChange("searchText", event.target.value)} onKeyDown={(event) => event.key === "Enter" && onGenerate()} placeholder="Search employee..." /></label>
        <button type="button" className="uwa-primary-button" disabled={loading} onClick={onGenerate}>{loading ? "Loading…" : "Generate"}</button>
        <button type="button" className="uwa-export-button" disabled={exportDisabled} title={exportDisabled ? "Available after data integration" : "Export report"} onClick={onExport}><Download size={16} /> Export</button>
      </div>
    </div>
  );
}

export default AttendanceMatrixControls;
