import { makeRequest } from "../../../api/httpClient";
import { downloadBlobResponse } from "../../../utils/download.utils";
import { normalizeReportOption, toReportArray } from "../report.utils";

export const defaultPerformanceFilters = {
  user_id: "",
  from_date: "",
  to_date: "",
  company_id: "",
  ticket_status: "",
};

export async function fetchReportUsers(searchText = "") {
  const response = await makeRequest("/system/searchList", {
    method: "POST",
    body: {
      tableName: "admin",
      selectFields: "adminID,name,email,userName,roleID,status",
      searchField: "name",
      searchText,
      status: "active",
    },
  });

  if (!response?.success) return [];

  return toReportArray(response)
    .map((item) => normalizeReportOption(item, ["adminID", "adminId", "user_id", "id"], ["name", "userName", "email"]))
    .filter((item) => item.value);
}

export async function fetchReportCompanies(searchText = "") {
  const response = await makeRequest("/system/searchList", {
    method: "POST",
    body: {
      tableName: "company_master",
      selectFields: "company_id,company_name",
      searchField: "company_name",
      searchText,
      status: "active",
    },
  });

  if (!response?.success) return [];

  return toReportArray(response)
    .map((item) => normalizeReportOption(item, ["company_id", "id"], ["company_name", "name"]))
    .filter((item) => item.value);
}

export async function fetchTicketStatuses(searchText = "") {
  const response = await makeRequest("/system/searchSlugList", {
    method: "POST",
    body: {
      tableName: "categories",
      selectFields: "category_id,categoryName,cat_color",
      searchField: "categoryName",
      slug: "ticket_status",
      searchText,
      status: "active",
    },
  });

  if (!response?.success) return [];

  return toReportArray(response)
    .map((item) => ({
      ...normalizeReportOption(item, ["category_id", "id"], ["categoryName", "name"]),
      color: item.cat_color,
    }))
    .filter((item) => item.value);
}

export function normalizePerformanceResponse(response = {}) {
  const data = response.data || response;
  return {
    success: response.success !== false,
    message: response.message || "",
    user: data.user || data.user_details || data.userDetails || {},
    summary: data.summary || {},
    charts: data.charts || {},
    tickets: toReportArray(data.tickets),
    activities: toReportArray(data.activities || data.timeline),
    pagination: data.pagination || response.pagination || {},
  };
}

export async function fetchUserPerformance(filters = {}, options = {}) {
  const response = await makeRequest("/reports/user-performance", {
    method: "POST",
    body: {
      ...defaultPerformanceFilters,
      ...filters,
      page: options.page || 1,
      limit: options.limit || 10,
      searchText: options.searchText || "",
      order_by: options.order_by || "created_date",
      order: options.order || "DESC",
    },
  });

  return normalizePerformanceResponse(response);
}

export async function downloadUserPerformanceExcel(filters = {}, options = {}) {
  const response = await makeRequest("/reports/user-performance/export-excel", {
    method: "POST",
    body: {
      ...defaultPerformanceFilters,
      ...filters,
      searchText: options.searchText || "",
      order_by: options.order_by || "created_date",
      order: options.order || "DESC",
    },
    responseType: "blob",
    timeout: 30000,
  });

  if (!response?.success) return response;

  const downloaded = downloadBlobResponse(response, "performance-report.xls");
  return {
    success: downloaded,
    message: downloaded ? "" : "Unable to download performance report.",
  };
}

export function buildReportSqlReference() {
  return {
    summary: `
SELECT
  COUNT(*) AS assigned,
  SUM(CASE WHEN ticket_status = :closed_status THEN 1 ELSE 0 END) AS closed,
  SUM(CASE WHEN ticket_status <> :closed_status THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN due_date < CURRENT_DATE AND ticket_status <> :closed_status THEN 1 ELSE 0 END) AS overdue,
  AVG(TIMESTAMPDIFF(HOUR, created_date, modified_date)) AS avg_resolution_time,
  ((SUM(CASE WHEN ticket_status = :closed_status THEN 1 ELSE 0 END) * 2)
    - (SUM(CASE WHEN due_date < CURRENT_DATE AND ticket_status <> :closed_status THEN 1 ELSE 0 END) * 1.5)) AS productivity_score
FROM tickets
WHERE assignee = :user_id
  AND (:from_date = '' OR DATE(created_date) >= :from_date)
  AND (:to_date = '' OR DATE(created_date) <= :to_date)
  AND (:company_id = '' OR company_id = :company_id)
  AND (:ticket_status = '' OR ticket_status = :ticket_status);`,
    activityLogTable: `
CREATE TABLE ticket_activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  action_by BIGINT NOT NULL,
  old_status VARCHAR(100),
  new_status VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_activity_ticket (ticket_id),
  INDEX idx_ticket_activity_user_date (action_by, created_at)
);`,
  };
}
