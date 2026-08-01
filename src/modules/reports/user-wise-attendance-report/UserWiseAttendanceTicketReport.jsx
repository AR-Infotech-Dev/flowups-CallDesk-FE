import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  RotateCcw,
  Search,
  Ticket,
  TriangleAlert,
  UserCheck,
  Users,
  CalendarCheck2,
  LogIn,
  Timer,

} from "lucide-react";
import {
  formatReportDate,
  formatReportDuration,
  formatReportTime,
  toReportDateInput,
} from "../report.utils";
import { toast } from "react-toastify";
import ModulePagination from "../../shared/ModulePagination";
import { getCurrentSession } from "../../../auth/utils/authStorage";
import { fetchReportCompanies } from "../performance-report/performance.service";
import {
  fetchUserWiseAttendanceReport,
  downloadUserWiseAttendanceReport,
} from "./userWiseAttendanceReport.service";

import "./user-wise-attendance-report.css";
import { useAuth } from "@/auth/components/AuthProvider";

const getDefaultFilters = () => {
  const today = new Date();
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const user = getCurrentSession()?.user || {};

  return {
    company_id: String(user.company_id || ""),
    from_date: toReportDateInput(monthStart),
    to_date: toReportDateInput(today),
    searchText: "",
  };
};

const EMPTY_USER_WISE_ATTENDANCE_REPORT = {
  company: {},
  summary: {},
  users: [],
  pagination: {},
};
const isAmcCustomer = (value) =>
  ["1", "true", "y", "yes"].includes(
    String(value || "").toLowerCase()
  );
const summaryItems = [
  { key: "total_users", label: "Total Users", icon: Users, tone: "cyan" },
  { key: "signed_in_users", label: "Signed In Users", icon: LogIn, tone: "green" },
  { key: "signed_out_users", label: "Signed Out Users", icon: CheckCircle2, tone: "blue" },
  { key: "total_logs", label: "Total Logs", icon: CalendarCheck2, tone: "amber" },
  { key: "total_signins", label: "Total Sign In", icon: LogIn, tone: "violet" },
  { key: "total_signouts", label: "Total Sign Out", icon: Clock3, tone: "red" },
];


function UserWiseAttendanceTicketReport() {
  const { authSession } = useAuth();

  const roleSlug = authSession?.user?.role_slug;

  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState(getDefaultFilters);

  const [report, setReport] = useState(
    EMPTY_USER_WISE_ATTENDANCE_REPORT
  );

  const [loading, setLoading] = useState(false);

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (item) =>
          String(item.value) ===
          String(filters.company_id)
      ),
    [companies, filters.company_id]
  );

  useEffect(() => {
    let mounted = true;

    fetchReportCompanies().then((items) => {
      if (!mounted) return;

      const user = getCurrentSession()?.user || {};
      const isSuperAdmin =
        user.role_slug === "super_admin";

      const scopedItems = isSuperAdmin
        ? items
        : items.filter(
          (item) =>
            String(item.value) ===
            String(user.company_id || "")
        );

      const visibleItems = scopedItems.length
        ? scopedItems
        : user.company_id
          ? [
            {
              value: String(user.company_id),
              label:
                user.company_name || "My Company",
            },
          ]
          : [];

      setCompanies(visibleItems);

      setFilters((current) => ({
        ...current,
        company_id:
          current.company_id ||
          (visibleItems.length === 1
            ? visibleItems[0].value
            : ""),
      }));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const loadReport = async (
    nextFilters = appliedFilters,
    page = 1
  ) => {
    if (!nextFilters.company_id) {
      toast.error("Please select a company.");
      return;
    }

    setLoading(true);

    const response =
      await fetchUserWiseAttendanceReport(
        nextFilters,
        page
      );

    setLoading(false);

    if (!response.success) {
      toast.error(response.message);
      return;
    }

    setReport(response);
  };

  const generateReport = () => {
    setAppliedFilters(filters);
    loadReport(filters, 1);
  };

  const handleExport = () => {
    downloadUserWiseAttendanceReport(filters);
  };

  const resetReport = () => {
    const nextFilters = getDefaultFilters();

    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setReport(
      EMPTY_USER_WISE_ATTENDANCE_REPORT
    );
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="user-wise-attendance-report-page">
      <header className="user-wise-attendance-report-header">
        <div>
          <span>User Wise Attendance Report</span>
          <h2>User Wise Attendance</h2>
          <p>
            User-wise attendance report for the selected company and period.
          </p>
        </div>

        <div className="user-wise-attendance-report-company">
          <Building2 size={16} />
          <span>
            {report.company?.company_name ||
              selectedCompany?.label ||
              "Select Company"}
          </span>
        </div>
      </header>

      <div className="user-wise-attendance-report-filters">
        <label>
          <span>Company</span>
          <select
            value={filters.company_id}
            onChange={(e) =>
              updateFilter("company_id", e.target.value)
            }
          >
            <option value="">Select Company</option>

            {companies.map((company) => (
              <option
                key={company.value}
                value={company.value}
              >
                {company.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>From Date</span>

          <input
            type="date"
            value={filters.from_date}
            onChange={(e) =>
              updateFilter("from_date", e.target.value)
            }
          />
        </label>

        <label>
          <span>To Date</span>

          <input
            type="date"
            value={filters.to_date}
            onChange={(e) =>
              updateFilter("to_date", e.target.value)
            }
          />
        </label>

        <label className="user-wise-attendance-report-search">
          <span>User</span>

          <input
            type="search"
            value={filters.searchText}
            placeholder="Name, Email or Mobile"
            onChange={(e) =>
              updateFilter("searchText", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") generateReport();
            }}
          />
        </label>

        <div className="user-wise-attendance-report-filter-actions">
          <button
            type="button"
            className="primary"
            disabled={loading}
            onClick={generateReport}
          >
            <Search size={14} />
            {loading ? "Loading..." : "Generate"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={resetReport}
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <button type="button"
            disabled={loading}
            onClick={handleExport}
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="user-wise-attendance-report-scroll">
        <section className="user-wise-attendance-report-summary">
          {summaryItems.map(({ key, label, icon: Icon, tone }) => (
            <article
              key={key}
              className={`user-wise-attendance-summary-card ${tone}`}
            >
              <span>
                <Icon size={15} />
              </span>

              <div>
                <small>{label}</small>
                <strong>
                  {Number(report.summary?.[key] || 0)}
                </strong>
              </div>
            </article>
          ))}
        </section>

        <section className="user-wise-attendance-report-panel">
          <div className="user-wise-attendance-report-panel-head">
            <div>
              <span>Daily Log</span>
              <h3>Attendance Breakdown</h3>
            </div>

            <p>{report.pagination?.total || 0} Users</p>
          </div>

          <div className="user-wise-attendance-report-table-wrap">
            <table className="user-wise-attendance-report-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Completed</th>
                  <th>Missing Out </th>
                  <th>Total Hours</th>
                  <th>Average Hours</th>
                  <th>Attendance</th>
                  
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.attendance?.length > 0 ? (
                  
                  report.attendance.map((row) => (
                    
                    <tr key={row.user_id}>
                      {/* Employee */}
                      <td>
                        <div className="font-medium">
                          {row.user_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {row.email}
                        </div>
                      </td>

                    
                      {/* Present */}
                      <td>{row.present_days}</td>

                      {/* Absent */}
                      <td>-</td>

                      {/* Completed */}
                      <td>
                        {row.last_event === "signout"
                          ? "Yes"
                          : "No"}
                      </td>

                      {/* Missing Out */}
                      <td>
                        {row.last_event === "signin"
                          ? "Yes"
                          : "No"}
                      </td>

                      {/* Total Hours */}
                      <td>-</td>

                      {/* Avg Hours */}
                      <td>-</td>

                      {/* Attendance */}
                      <td>{row.last_location || "-"}</td>

                    
                      {/* Active */}
                      <td>
                        {row.last_activity
                          ? formatReportTime(row.last_activity)
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4">
                      No Records Found
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          <ModulePagination
            pagination={report.pagination}
            onPageChange={(nextPage) =>
              loadReport(appliedFilters, nextPage)
            }
          />
        </section>
      </div>
    </section>
  );
}

export default UserWiseAttendanceTicketReport;
