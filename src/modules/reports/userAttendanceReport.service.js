import { makeRequest } from "../../api/httpClient";

export async function fetchUserAttendanceReport(filters = {}, page = 1) {
  const response = await makeRequest("/reports/attendance", {
    method: "POST",
    body: {
      user_id: filters.user_id || "",
      company_id: filters.company_id || "",
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
      page,
      limit: 20,
    },
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || "Unable to load attendance report.",
    };
  }

  const data = response.data || {};
  return {
    success: true,
    user: data.user || {},
    company: data.company || {},
    summary: data.summary || {},
    attendance: Array.isArray(data.attendance) ? data.attendance : [],
    pagination: data.pagination || {},
    filters: data.filters || {},
  };
}
