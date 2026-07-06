const statusOptions = [
  { value: "all", label: "All" },
  { value: "expired", label: "Expired" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "valid", label: "Valid" },
];

function ProductExpiryReportFilters({ filters, searchText, onFilterChange, onSearchChange, onApply, onReset }) {
  return (
    <div className="product-expiry-filters">
      <div className="product-expiry-filter-grid">
        <InputField label="Search Text" placeholder="Serial no" type="text" value={searchText} onChange={onSearchChange} />
        <SelectField label="Status" value={filters.expiry_status} options={statusOptions} onChange={(value) => onFilterChange("expiry_status", value)} />
        <InputField label="From Expiry" type="date" value={filters.from_date} onChange={(value) => onFilterChange("from_date", value)} />
        <InputField label="To Expiry" type="date" value={filters.to_date} onChange={(value) => onFilterChange("to_date", value)} />
        <InputField label="Expiring Days" type="number" value={filters.expiring_days} onChange={(value) => onFilterChange("expiring_days", value)} />
        <div className="product-expiry-actions">
          <button type="button" className="product-expiry-button primary" onClick={onApply}>Apply</button>
          <button type="button" className="product-expiry-button" onClick={onReset}>Reset</button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="product-expiry-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, type, value, placeholder, onChange }) {
  return (
    <label className="product-expiry-field">
      <span>{label}</span>
      <input
        placeholder={placeholder}
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default ProductExpiryReportFilters;
