import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@auth/components/AuthProvider";
import ModulePageLayout from "../../shared/ModulePageLayout";
import ActivityTimeline from "./components/ActivityTimeline";
import PerformanceCards from "./components/PerformanceCards";
import PerformanceCharts from "./components/PerformanceCharts";
import PerformanceTable from "./components/PerformanceTable";
import { UserPerformanceToolbar } from "./components/UserPerformanceHeader";
import { UserPerformanceHero } from "./components/UserPerformanceHero";
import { useUserPerformanceReport } from "./hooks/useUserPerformanceReport";
import { getPerformanceExportPermission } from "./utils/performanceReport.utils";
import "./reports.css";

function UserPerformancePage({ menu_id }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { authSession } = useAuth();
  const {
    report,
    loading,
    searchText,
    sortConfig,
    userName,
    rating,
    setPage,
    handleTicketSearchChange,
    handleSortChange,
    handleExportExcel,
    handleExportPdf,
  } = useUserPerformanceReport({ userId });
  const canExport = getPerformanceExportPermission({ menuId: menu_id, user: authSession?.user || {} });

  return (
    <ModulePageLayout
      title="User Performance"
      description="Detailed ticket performance, productivity, and activity for one user."
      classNames="performance-page-header"
      controls={
        <UserPerformanceToolbar
          loading={loading}
          canExport={canExport}
          onBack={() => navigate("/reports/performance")}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />
      }
      table={
        <div className="performance-report-shell">
          <UserPerformanceHero
            userName={userName}
            summary={report.summary}
            rating={rating}
          />
          <PerformanceCards summary={report.summary} loading={loading} />
          <PerformanceCharts charts={report.charts} />
          <PerformanceTable
            rows={report.tickets}
            loading={loading}
            pagination={report.pagination}
            searchText={searchText}
            sortConfig={sortConfig}
            onSearchChange={handleTicketSearchChange}
            onSortChange={handleSortChange}
            onPageChange={setPage}
          />
          <ActivityTimeline activities={report.activities} loading={loading} />
        </div>
      }
    />
  );
}

export default UserPerformancePage;
