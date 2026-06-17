import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import ProductExpiryReportFilters from "./components/ProductExpiryReportFilters";
import ProductExpiryReportSummary from "./components/ProductExpiryReportSummary";
import ProductExpiryReportTable from "./components/ProductExpiryReportTable";
import { defaultProductExpiryFilters, fetchExpiryReport } from "./data/product.report.service";
import "./product-expiry-report.css";

const defaultSort = { key: "expiry_date", direction: "ASC" };

function ProductExpiryReport() {
  const [filters, setFilters] = useState(defaultProductExpiryFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultProductExpiryFilters);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultSort);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const response = await fetchExpiryReport(appliedFilters, {
      page,
      limit: 20,
      searchText: debouncedSearchText,
      orderBy: sortConfig.key,
      order: sortConfig.direction,
    });
    setLoading(false);

    if (!response.success) {
      toast.error(response.message || "Unable to load product expiry report");
      return;
    }

    setRows(response.data || []);
    setSummary(response.summary || {});
    setPagination(response.pagination || {});
  }, [appliedFilters, debouncedSearchText, page, sortConfig]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleApply = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultProductExpiryFilters);
    setAppliedFilters(defaultProductExpiryFilters);
    setSearchText("");
    setPage(1);
    setSortConfig(defaultSort);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "ASC" ? "DESC" : "ASC",
    }));
  };

  return (
    <ModulePageLayout
      title="Product Expiry Report"
      description="Track customer product expiries, expired products, and upcoming renewal risk."
      table={
        <div className="product-expiry-page">
          <ProductExpiryReportFilters
            filters={filters}
            searchText={searchText}
            onApply={handleApply}
            onReset={handleReset}
            onSearchChange={(value) => {
              setPage(1);
              setSearchText(value);
            }}
            onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          />
          <ProductExpiryReportSummary summary={summary} />
          <ProductExpiryReportTable rows={rows} loading={loading} sortConfig={sortConfig} onSort={handleSort} />
          <ModulePagination pagination={pagination} onPageChange={setPage} />
        </div>
      }
    />
  );

}

export default ProductExpiryReport;
