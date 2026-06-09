import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getMenuPermission, hasMenuActionPermission } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthProvider";
import ModulePageLayout from "../shared/ModulePageLayout";
import PerformanceReportWorkspace from "./PerformanceReportWorkspace";
import { exportPerformanceExcel, exportPerformancePdf } from "./reportExport";
import {
  defaultPerformanceFilters,
  fetchReportCompanies,
  fetchReportUsers,
  fetchTicketStatuses,
  fetchUserPerformance,
} from "./performance.service";
import "./reports.css";

const defaultSort = { key: "assigned_date", direction: "DESC" };

function getExportPermission({ menuId, user }) {
  if (user?.role_slug === "super_admin") return true;
  const permission = getMenuPermission(menuId);
  return Boolean(true);
  return Boolean(
    permission.can_export_reports ||
    permission.export_reports ||
    permission.can_export ||
    hasMenuActionPermission({ menuId, action: "export", user })
  );
}

function PerformanceReportPage({ menu_id }) {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const user = authSession?.user || {};
  const canExport = getExportPermission({ menuId: menu_id, user });
  const [filters, setFilters] = useState(defaultPerformanceFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultPerformanceFilters);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [report, setReport] = useState({ summary: {}, charts: {}, tickets: [], activities: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultSort);

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
    () => users.find((item) => String(item.value) === String(appliedFilters.user_id)) || null,
    [appliedFilters.user_id, users]
  );

  const loadReport = useCallback(async () => {
    if (!appliedFilters.user_id) {
      setReport({ summary: {}, charts: {}, tickets: [], activities: [], pagination: {} });
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
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultPerformanceFilters);
    setAppliedFilters(defaultPerformanceFilters);
    setSearchText("");
    setPage(1);
    setReport({ summary: {}, charts: {}, tickets: [], activities: [], pagination: {} });
  };

  const handleSortChange = (columnKey) => {
    setPage(1);
    setSortConfig((current) => ({
      key: columnKey,
      direction: current.key === columnKey && current.direction === "ASC" ? "DESC" : "ASC",
    }));
  };

  const handleExportExcel = () => {
    setExporting(true);
    exportPerformanceExcel({
      filters: appliedFilters,
      summary: report.summary,
      tickets: report.tickets,
      user: report.user || selectedUser || {},
      fileName: `${`${selectedUser.label}-(PR)` || "all"}`,
    });
    setExporting(false);
  };

  const handleExportPdf = () => {
    setExporting(true);
    const opened = exportPerformancePdf({
      // filters: appliedFilters,
      summary: report.summary,
      tickets: report.tickets,
      user: report.user || selectedUser || {},
    });
    if (!opened) toast.error("Unable to open print window. Please allow popups for PDF export.");
    setExporting(false);
  };

  return (
    <ModulePageLayout
      title="Performance Reports"
      description="Review user-wise ticket performance, closure trends, productivity score, and activity."
      classNames="performance-page-header"
      table={
        <PerformanceReportWorkspace
          filters={filters}
          users={users}
          companies={companies}
          statuses={statuses}
          loading={loading}
          exporting={exporting}
          canExport={canExport && Boolean(appliedFilters.user_id)}
          onFilterChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          hasSelection={Boolean(appliedFilters.user_id)}
          selectedUserName={selectedUser?.label || report.user?.name || `User #${appliedFilters.user_id}`}
          report={report}
          searchText={searchText}
          sortConfig={sortConfig}
          onTicketSearchChange={(value) => {
            setPage(1);
            setSearchText(value);
          }}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onOpenDetail={() => navigate(`/reports/performance/${appliedFilters.user_id}`)}
        />
      }
    />
  );
}

export default PerformanceReportPage;
