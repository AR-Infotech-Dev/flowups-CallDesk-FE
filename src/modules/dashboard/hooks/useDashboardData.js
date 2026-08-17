import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2, Ticket, UserCheck, Users } from "lucide-react";
import { emptyDashboardData } from "../data/module.schema";
import { getDashboard } from "../data/dashboard.service";
import { getRoleLabel, isAdminRole } from "../utils/dashboard.utils";

const statIconMap = {
  customers: Users,
  tickets: Ticket,
  followups: CalendarDays,
  users: UserCheck,
  companies: Building2,
  sla: Activity,
  myOpen: Ticket,
  myFollowups: CalendarDays,
  closed: CheckCircle2,
  overdue: AlertTriangle,
};

export const useDashboardData = ({ roleSlug = "user" } = {}) => {
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [dashboardFilter, setDashboardFilter] = useState({
    from_date: null,
    to_date: null,
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError("");

    const res = await getDashboard(dashboardFilter);

    if (res?.success) {
      setDashboardData(res.data || emptyDashboardData);
    } else {
      setDashboardData(emptyDashboardData);
      setDashboardError(res?.message || "Unable to load dashboard");
    }

    setLoadingDashboard(false);
  }, [dashboardFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const setDashboardFilterValue = (name, value) => {
    setDashboardFilter((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const clearDashboardFilter = () => {
    setDashboardFilter({ from_date: null, to_date: null });
  };

  const resolvedRoleSlug = dashboardData?.role || roleSlug;
  const adminView = dashboardData?.scope ? dashboardData.scope === "admin" : isAdminRole(roleSlug);

  const dashboard = useMemo(
    () => ({
      roleLabel: getRoleLabel(resolvedRoleSlug),
      stats: (dashboardData.summary || []).map((stat) => ({
        ...stat,
        icon: statIconMap[stat.key] || Activity,
        value: stat.value ?? 0,
        delta: stat.delta || "0",
        tone: stat.tone || "blue",
      })),
      ticketStatus: dashboardData.charts?.ticketStatus || [],
      trend: dashboardData.charts?.ticketTrend || [],
      bars: dashboardData.charts?.workload || [],
      activity: dashboardData.recentActivity || [],
      amcHealth: dashboardData.charts?.amcHealth || [],
      amcAlerts: dashboardData.amcAlerts || [],
      productExpiryAlerts: dashboardData.productExpiryAlerts || [],
      quotationFollowups: dashboardData.quotationFollowups || [],
      title: adminView ? "Operations Dashboard" : "My Dashboard",
      subtitle: adminView ? "Live CRM workload, team performance, and SLA health." : "Your assigned work, follow-ups, and ticket progress.",
    }),
    [adminView, dashboardData, resolvedRoleSlug]
  );

  return {
    dashboard,
    loadingDashboard,
    dashboardError,
    dashboardFilter,
    setDashboardFilter,
    setDashboardFilterValue,
    clearDashboardFilter,
    loadDashboard,
    adminView,
  };
};
