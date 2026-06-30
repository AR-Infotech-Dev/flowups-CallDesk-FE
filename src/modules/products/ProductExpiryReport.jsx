import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import ProductExpiryReportFilters from "./components/ProductExpiryReportFilters";
import ProductExpiryReportSummary from "./components/ProductExpiryReportSummary";
import ProductExpiryReportTable from "./components/ProductExpiryReportTable";
import ProductActivityModal from "./components/ProductActivityModal";
import ProductExpiryCallDescriptionModal from "./components/ProductExpiryCallDescriptionModal";
import {
  defaultProductExpiryFilters,
  fetchProductActivity,
  getDefaultProductExpiryCallDescription,
  getProductExpiryReport,
  makeToCustomer,
} from "./data/product.report.service";
import "./product-expiry-report.css";

const defaultSort = { key: "expiry_date", direction: "ASC" };

const getProductActivityPayload = (row = {}) => ({
  product_id: row.product_id || null,
  product_name: row.product_name || "",
  serial_number: row.serial_number || "",
  expiry_date: row.expiry_date || null,
  days_left: row.days_left || null,
  expiry_status: row.expiry_status || null,
  add_ons: row.add_ons || [],
});

function ProductExpiryReport() {
  const [filters, setFilters] = useState(defaultProductExpiryFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultProductExpiryFilters);
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [activityCustomer, setActivityCustomer] = useState(null);
  const [activityProduct, setActivityProduct] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityTab, setActivityTab] = useState("calls");
  const [activityLoadingRowKey, setActivityLoadingRowKey] = useState(null);
  const [callRow, setCallRow] = useState(null);
  const [callDescription, setCallDescription] = useState("");
  const [callingRowKey, setCallingRowKey] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 350);
    return () => clearTimeout(timer);
  }, [searchText]);
  const refreshList = () => {
    setRefresh((prev => prev + 1))
  };
  const loadReport = useCallback(async () => {
    setLoading(true);
    const response = await getProductExpiryReport(appliedFilters, {
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
  }, [appliedFilters, debouncedSearchText, page, sortConfig, refresh]);

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

  const handleOpenActivity = async (row) => {
    const customerId = row?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    const product = getProductActivityPayload(row);
    const rowKey = `${customerId}-${product.serial_number || product.product_id || ""}`;
    setActivityLoadingRowKey(rowKey);
    const response = await fetchProductActivity({ customer_id: customerId, product });
    setActivityLoadingRowKey(null);

    if (response?.success) {
      setActivityCustomer({
        customer_id: row.customer_id,
        name: row.customer_name,
        email: row.email,
        mobile_no: row.mobile_no,
      });
      console.log(response);
      
      setActivityProduct(product);
      setActivityData(response.data || {});
      setActivityTab("calls");
      return;
    }

    toast.error(response?.message || "Unable to fetch product activity.");
  };

  const getCallDetails = (row = {}) => ({
    product: {
      product_id: row.product_id || null,
      product_name: row.product_name || null,
      serial_number: row.serial_number || null,
      expiry_date: row.expiry_date || null,
      days_left: row.days_left || null,
      expiry_status: row.expiry_status || null,
      add_ons: row.add_ons || null,
    },
    customer_id: row.customer_id || null,
  });

  const openCallModal = (row) => {
    if (!row?.customer_id) {
      toast.error("Customer not found !");
      return;
    }

    setCallRow(row);
    setCallDescription(getDefaultProductExpiryCallDescription(row));
  };

  const closeCallModal = () => {
    if (callingRowKey) return;
    setCallRow(null);
    setCallDescription("");
  };

  const handleConfirmCall = async () => {
    const description = String(callDescription || "").trim();
    if (!callRow?.customer_id) {
      toast.error("Customer not found !");
      return;
    }

    if (!description) {
      toast.error("Call description required!");
      return;
    }

    const { product, customer_id } = getCallDetails(callRow);
    const rowKey = `${customer_id}-${product.serial_number || product.product_id || ""}`;

    setCallingRowKey(rowKey);
    const res = await makeToCustomer({ customer_id, product, description });
    setCallingRowKey(null);

    if (res.success) {
      toast.success(res?.message || "Call registered successfully");
      setCallRow(null);
      setCallDescription("");
      refreshList();
      return;
    }

    toast.error(res?.msg || res?.message || "Something went wrong");
  };

  const closeActivityModal = () => {
    setActivityCustomer(null);
    setActivityProduct(null);
    setActivityData(null);
    setActivityTab("calls");
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
          <ProductExpiryReportTable
            rows={rows}
            loading={loading}
            sortConfig={sortConfig}
            refreshList={refreshList}
            onSort={handleSort}
            onMakeCall={openCallModal}
            onOpenActivity={handleOpenActivity}
            activityLoadingRowKey={activityLoadingRowKey}
            callingRowKey={callingRowKey}
          />
          <ModulePagination pagination={pagination} onPageChange={setPage} />
          <ProductActivityModal
            customer={activityCustomer}
            product={activityProduct}
            activity={activityData}
            activeTab={activityTab}
            onTabChange={setActivityTab}
            onClose={closeActivityModal}
          />
          <ProductExpiryCallDescriptionModal
            row={callRow}
            description={callDescription}
            saving={Boolean(callingRowKey)}
            onChange={setCallDescription}
            onClose={closeCallModal}
            onConfirm={handleConfirmCall}
          />
        </div>
      }
    />
  );

}

export default ProductExpiryReport;
