import { makeRequest } from "../../../api/httpClient";
import { downloadBlobResponse } from "../../../utils/download.utils";

export async function fetchCompanyCustomerTicketReport(filters = {}, page = 1) {
  const response = await makeRequest("/reports/customer-wise", {
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
      message: response?.message || "Unable to load company report.",
    };
  }

  const data = response.data || {};
  return {
    success: true,
    company: data.company || {},
    summary: data.summary || {},
    customers: Array.isArray(data.customers) ? data.customers : [],
    pagination: data.pagination || {},
    filters: data.filters || {},
  };
}
export async function downloadCustomerWiseReport(filters = {}, options = {}) {
  const response = await makeRequest("/reports/customer-wise-report-excel", {
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

  const downloaded = downloadBlobResponse(response, "Customer-wise-report.xls");
  return {
    success: downloaded,
    message: downloaded ? "" : "Unable to download Customer-wise report.",
  };
}
