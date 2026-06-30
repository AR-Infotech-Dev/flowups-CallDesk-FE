import { makeRequest } from "@/api/httpClient";

export const defaultWorkReportFilters = {
  user_id: "",
  company_id: "",
  from_date: "",
  to_date: "",
};

export const defaultWorkReportSort = {
  key: "work_start_at",
  direction: "DESC",
};

export const fetchWorkReport = async ({ filters, page, searchText, sortConfig }) => {
  return await makeRequest("/reports/work-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...filters,
      page,
      limit: 10,
      searchText,
      order_by: sortConfig.key,
      order: sortConfig.direction,
    }),
  });
};
