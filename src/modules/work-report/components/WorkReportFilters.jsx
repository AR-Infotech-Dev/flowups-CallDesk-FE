export function WorkReportFilters({
  filters,
  users,
  companies,
  searchText,
  onFilterChange,
  onSearchChange,
  onSearch,
  onReset,
}) {
  return (
    <div className="work-report-filters">
      <div className="work-report-filter-grid">
        <SelectField label="Employee" value={filters.user_id} options={users} onChange={(value) => onFilterChange("user_id", value)} />
        <SelectField label="Company" value={filters.company_id} options={companies} onChange={(value) => onFilterChange("company_id", value)} />
        <InputField label="From Date" type="date" value={filters.from_date} onChange={(value) => onFilterChange("from_date", value)} />
        <InputField label="To Date" type="date" value={filters.to_date} onChange={(value) => onFilterChange("to_date", value)} />
      </div>
      <div className="work-report-search-row">
        <input
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search ticket, client, employee, work details"
          className="work-report-search"
        />
        <div className="work-report-actions">
          <button type="button" onClick={onSearch} className="work-report-button primary">Apply</button>
          <button type="button" onClick={onReset} className="work-report-button">Reset</button>
        </div>
      </div>
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
