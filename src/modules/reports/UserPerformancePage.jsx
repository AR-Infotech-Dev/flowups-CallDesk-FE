import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Award, Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@auth/components/AuthProvider";
import { getMenuPermission, hasMenuActionPermission } from "@auth/utils/permissions";
import ModulePageLayout from "../shared/ModulePageLayout";
import ActivityTimeline from "./ActivityTimeline";
import PerformanceCards from "./PerformanceCards";
import PerformanceCharts from "./PerformanceCharts";
import PerformanceTable from "./PerformanceTable";
import { exportPerformanceExcel, exportPerformancePdf } from "./reportExport";
import { defaultPerformanceFilters, fetchUserPerformance } from "./performance.service";
import "./reports.css";

const defaultSort = { key: "assigned_date", direction: "DESC" };

function getRating(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Needs Attention";
  return "Low";
}

function getExportPermission({ menuId, user }) {
  if (user?.role_slug === "super_admin") return true;
  const permission = getMenuPermission(menuId);
  return Boolean(
    permission.can_export_reports ||
    permission.export_reports ||
    permission.can_export ||
    hasMenuActionPermission({ menuId, action: "export", user })
  );
}

function UserPerformancePage({ menu_id }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { authSession } = useAuth();
  const canExport = getExportPermission({ menuId: menu_id, user: authSession?.user || {} });
  const [report, setReport] = useState({ user: {}, summary: {}, charts: {}, tickets: [], activities: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState(defaultSort);

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

  const handleSortChange = (columnKey) => {
    setPage(1);
    setSortConfig((current) => ({
      key: columnKey,
      direction: current.key === columnKey && current.direction === "ASC" ? "DESC" : "ASC",
    }));
  };

  const userName = report.user?.name || report.user?.userName || report.user?.email || `User #${userId}`;
  const rating = getRating(report.summary?.productivity_score);

  return (
    <ModulePageLayout
      title="User Performance"
      description="Detailed ticket performance, productivity, and activity for one user."
      classNames="performance-page-header"
      controls={
        <div className="performance-detail-toolbar">
          <button type="button" className="performance-button" onClick={() => navigate("/reports/performance")}>
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="performance-detail-export">
            <button
              type="button"
              className="performance-button"
              disabled={ loading}
              // disabled={!canExport || loading}
              onClick={() => exportPerformanceExcel({ filters, summary: report.summary, tickets: report.tickets, user: report.user, fileName: `performance-${userId}` })}
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              type="button"
              className="performance-button"
              // disabled={!canExport || loading}
              disabled={ loading}
              onClick={() => exportPerformancePdf({ filters, summary: report.summary, tickets: report.tickets, user: report.user })}
            >
              <FileText size={14} />
              Export PDF
            </button>
          </div>
        </div>
      }
      table={
        <div className="performance-report-shell">
          <section className="performance-user-hero">
            <div className="performance-user-avatar">{String(userName).charAt(0).toUpperCase()}</div>
            <div>
              <span>User Performance</span>
              <h3>{userName}</h3>
              <p>
                Assigned Tickets: {report.summary?.assigned || 0} · Closed Tickets: {report.summary?.closed || 0} · Pending Tickets: {report.summary?.pending || 0}
              </p>
            </div>
            <div className="performance-rating">
              <Award size={16} />
              {rating}
            </div>
          </section>

          <PerformanceCards summary={report.summary} loading={loading} />
          <PerformanceCharts charts={report.charts} />
          <PerformanceTable
            rows={report.tickets}
            loading={loading}
            pagination={report.pagination}
            searchText={searchText}
            sortConfig={sortConfig}
            onSearchChange={(value) => {
              setPage(1);
              setSearchText(value);
            }}
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
