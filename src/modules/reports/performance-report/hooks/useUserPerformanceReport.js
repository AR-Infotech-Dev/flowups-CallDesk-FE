import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { defaultPerformanceFilters, downloadUserPerformanceExcel, fetchUserPerformance } from "../performance.service";
import { exportPerformancePdf } from "../reportExport";
import {
  defaultPerformanceSort,
  emptyPerformanceReport,
  getNextPerformanceSort,
  getPerformanceRating,
  getUserReportName,
} from "../utils/performanceReport.utils";

export const useUserPerformanceReport = ({ userId }) => {
  const [report, setReport] = useState(emptyPerformanceReport);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultPerformanceSort);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filters = {
    ...defaultPerformanceFilters,
    user_id: userId,
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    const response = await fetchUserPerformance(filters, {
      page,
      searchText: debouncedSearchText,
      order_by: sortConfig.key,
      order: sortConfig.direction,
    });
    setLoading(false);

    if (!response.success) {
      toast.error(response.message || "Unable to load user performance");
      return;
    }

    setReport(response);
  }, [debouncedSearchText, page, sortConfig, userId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleTicketSearchChange = (value) => {
    setPage(1);
    setSearchText(value);
  };

  const handleSortChange = (columnKey) => {
    setPage(1);
    setSortConfig((current) => getNextPerformanceSort(current, columnKey));
  };

  const handleExportExcel = async () => {
    const response = await downloadUserPerformanceExcel({
      ...filters,
      user_name: report.user?.name || "",
    }, {
      searchText: debouncedSearchText,
      order_by: sortConfig.key,
      order: sortConfig.direction,
    });
    if (!response?.success) toast.error(response?.message || "Unable to export performance report.");
  };

  const handleExportPdf = () => {
    exportPerformancePdf({
      filters,
      summary: report.summary,
      tickets: report.tickets,
      user: report.user,
    });
  };

  return {
    filters,
    report,
    loading,
    page,
    searchText,
    sortConfig,
    userName: getUserReportName({ report, userId }),
    rating: getPerformanceRating(report.summary?.productivity_score),
    setPage,
    handleTicketSearchChange,
    handleSortChange,
    handleExportExcel,
    handleExportPdf,
  };
};
