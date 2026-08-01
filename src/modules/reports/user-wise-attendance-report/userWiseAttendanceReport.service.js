import { makeRequest } from "../../../api/httpClient";
import { downloadBlobResponse } from "../../../utils/download.utils";

export async function fetchUserWiseAttendanceReport(filters = {}, page = 1) {
  const response = await makeRequest("/reports/user-wise-attendance", {
    method: "POST",
    body: {
      company_id: filters.company_id || "",
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
      searchText: filters.searchText || "",
      page,
      limit: 20,
    },
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || "Unable to load user-wise attendance report.",
    };
  }

  const data = response.data || {};

  return {
  success: true,
  company: data.company || {},
  summary: data.summary || {},
  attendance: Array.isArray(data.users)
    ? data.users
    : [],
  pagination: data.pagination || {},
  filters: data.filters || {},
};
}

export async function downloadUserWiseAttendanceReport(
  filters = {},
  options = {}
) {
  const response = await makeRequest("/reports/user-wise-attendence/export-excel",  {
    method: "POST",
    body: {
      company_id: filters.company_id || "",
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
      searchText: filters.searchText || "",
    },
    responseType: "blob",
    timeout: 30000,
  });

  if (!response?.success) return response;

  const downloaded = downloadBlobResponse(
    response,
    "User-wise-attendance-report.xls"
  );

  return {
    success: downloaded,
    message: downloaded
      ? ""
      : "Unable to download User-wise Attendance report.",
  };
}


