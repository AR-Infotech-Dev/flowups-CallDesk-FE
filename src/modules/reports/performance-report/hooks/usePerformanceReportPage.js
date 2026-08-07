import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { downloadUserPerformanceExcel, fetchReportCompanies, fetchReportUsers, fetchTicketStatuses, fetchUserPerformance } from "../data/performance.service";
import { exportPerformancePdf } from "../reportExport";
import {
  defaultPerformanceSort,
  emptyPerformanceReport,
  getNextPerformanceSort,
  getSelectedReportUser,
} from "../utils/performanceReport.utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyPerformanceFilters,
  resetPerformanceFilters,
  selectAppliedPerformanceFilters,
  selectPerformanceFilters,
  setPerformanceFilters,
} from "../data/performanceReport.slice";

export const usePerformanceReportPage = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectPerformanceFilters);
  const appliedFilters = useAppSelector(selectAppliedPerformanceFilters);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [report, setReport] = useState(emptyPerformanceReport);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultPerformanceSort);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      const [nextUsers, nextCompanies, nextStatuses] = await Promise.all([
        fetchReportUsers(),
        fetchReportCompanies(),
        fetchTicketStatuses(),
      ]);

      if (!isMounted) return;
      setUsers(nextUsers);
      setCompanies(nextCompanies);
      setStatuses(nextStatuses);
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

  const selectedUser = useMemo(
    () => getSelectedReportUser({ users, userId: appliedFilters.user_id }),
    [appliedFilters.user_id, users]
  );

  const loadReport = useCallback(async () => {
    if (!appliedFilters.user_id) {
      setReport(emptyPerformanceReport);
      return;
    }

    setLoading(true);
    const response = await fetchUserPerformance(appliedFilters, {
      page,
      searchText: debouncedSearchText,
      order_by: sortConfig.key,
      order: sortConfig.direction,
    });
    setLoading(false);

    if (!response.success) {
      toast.error(response.message || "Unable to load performance report");
      return;
    }

    setReport(response);
  }, [appliedFilters, debouncedSearchText, page, sortConfig]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSearch = () => {
    if (!filters.user_id) {
      toast.error("Please select a user.");
      return;
    }

    setPage(1);
    dispatch(applyPerformanceFilters(filters));
  };

  const handleReset = () => {
    dispatch(resetPerformanceFilters());
    setSearchText("");
    setPage(1);
    setReport(emptyPerformanceReport);
  };

  const handleTicketSearchChange = (value) => {
    setPage(1);
    setSearchText(value);
  };

  const handleSortChange = (columnKey) => {
    setPage(1);
    setSortConfig((current) => getNextPerformanceSort(current, columnKey));
  };

  const handleExportExcel = async () => {
    setExporting(true);
    const response = await downloadUserPerformanceExcel({
      ...appliedFilters,
      user_name: selectedUser?.label || report.user?.name || "",
    }, {
      searchText: debouncedSearchText,
      order_by: sortConfig.key,
      order: sortConfig.direction,
    });
    if (!response?.success) toast.error(response?.message || "Unable to export performance report.");
    setExporting(false);
  };

  const handleExportPdf = () => {
    setExporting(true);
    const opened = exportPerformancePdf({
      summary: report.summary,
      tickets: report.tickets,
      user: report.user || selectedUser || {},
    });
    if (!opened) toast.error("Unable to open print window. Please allow popups for PDF export.");
    setExporting(false);
  };

  return {
    filters,
    appliedFilters,
    users,
    companies,
    statuses,
    report,
    loading,
    exporting,
    page,
    searchText,
    sortConfig,
    selectedUser,
    setFilters: (nextFilters) => dispatch(setPerformanceFilters(nextFilters)),
    setPage,
    handleSearch,
    handleReset,
    handleTicketSearchChange,
    handleSortChange,
    handleExportExcel,
    handleExportPdf,
  };
};
