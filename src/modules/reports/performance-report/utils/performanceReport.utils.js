import { getMenuPermission, hasMenuActionPermission } from "@auth/utils/permissions";

export const defaultPerformanceSort = { key: "assigned_date", direction: "DESC" };

export const emptyPerformanceReport = {
  user: {},
  summary: {},
  charts: {},
  tickets: [],
  activities: [],
  pagination: {},
};

export const getPerformanceRating = (score) => {
  const value = Number(score || 0);
  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Needs Attention";
  return "Low";
};

export const getPerformanceExportPermission = ({ menuId, user }) => {
  if (user?.role_slug === "super_admin") return true;

  const permission = getMenuPermission(menuId);
  return Boolean(
    permission.can_export_reports ||
    permission.export_reports ||
    permission.can_export ||
    hasMenuActionPermission({ menuId, action: "export", user })
  );
};

export const getSelectedReportUser = ({ users = [], userId }) =>
  users.find((item) => String(item.value) === String(userId)) || null;

export const getUserReportName = ({ report = {}, userId }) =>
  report.user?.name || report.user?.userName || report.user?.email || `User #${userId}`;

export const getNextPerformanceSort = (currentSort, columnKey) => ({
  key: columnKey,
  direction: currentSort.key === columnKey && currentSort.direction === "ASC" ? "DESC" : "ASC",
});
