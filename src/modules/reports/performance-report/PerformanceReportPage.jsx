import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/components/AuthProvider";
import ModulePageLayout from "../../shared/ModulePageLayout";
import PerformanceReportWorkspace from "./PerformanceReportWorkspace";
import { usePerformanceReportPage } from "./hooks/usePerformanceReportPage";
import { getPerformanceExportPermission } from "./utils/performanceReport.utils";
import "./reports.css";

function PerformanceReportPage({ menu_id }) {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const user = authSession?.user || {};
  const {
    filters,
    appliedFilters,
    users,
    companies,
    statuses,
    report,
    loading,
    exporting,
    searchText,
    sortConfig,
    selectedUser,
    setFilters,
    setPage,
    handleSearch,
    handleReset,
    handleTicketSearchChange,
    handleSortChange,
    handleExportExcel,
    handleExportPdf,
  } = usePerformanceReportPage();

  const canExport = getPerformanceExportPermission({ menuId: menu_id, user });

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
          onTicketSearchChange={handleTicketSearchChange}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onOpenDetail={() => navigate(`/reports/performance/${appliedFilters.user_id}`)}
        />
      }
    />
  );
}

export default PerformanceReportPage;
