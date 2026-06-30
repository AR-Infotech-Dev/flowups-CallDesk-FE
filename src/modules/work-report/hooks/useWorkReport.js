import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { fetchReportCompanies, fetchReportUsers } from "../../reports/performance.service";
import { defaultWorkReportFilters, defaultWorkReportSort, fetchWorkReport } from "../data/workReport.service";
import { buildWorkReportSummaryCards, getNextWorkReportSort } from "../utils/workReport.utils";

export const useWorkReport = () => {
  const [filters, setFilters] = useState(defaultWorkReportFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultWorkReportFilters);
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
  const [sortConfig, setSortConfig] = useState(defaultWorkReportSort);

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
    const res = await fetchWorkReport({
      filters: appliedFilters,
      page,
      searchText: debouncedSearchText,
      sortConfig,
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

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSearchChange = (value) => {
    setPage(1);
    setSearchText(value);
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultWorkReportFilters);
    setAppliedFilters(defaultWorkReportFilters);
    setSearchText("");
    setPage(1);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortConfig((current) => getNextWorkReportSort(current, key));
  };

  const summaryCards = useMemo(() => buildWorkReportSummaryCards(summary), [summary]);

  return {
    filters,
    users,
    companies,
    rows,
    companySummary,
    pagination,
    loading,
    searchText,
    sortConfig,
    summaryCards,
    setPage,
    handleFilterChange,
    handleSearchChange,
    handleSearch,
    handleReset,
    handleSort,
  };
};
