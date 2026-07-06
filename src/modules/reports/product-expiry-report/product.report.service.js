import { makeRequest } from "../../../api/httpClient";
import { toReportArray } from "../report.utils";

export const defaultProductExpiryFilters = {
  company_id: "",
  customer_id: "",
  product_id: "",
  expiry_status: "all",
  from_date: "",
  to_date: "",
  expiring_days: 30,
};

export async function getProductExpiryReport(filters = {}, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const response = await makeRequest("/reports/product-expiry", {
    method: "POST",
    body: {
      ...defaultProductExpiryFilters,
      ...filters,
      page,
      limit,
      searchText: options.searchText || "",
      orderBy: options.orderBy || options.order_by || "expiry_date",
      order: options.order || "ASC",
    },
  });

  const responseData = response?.data;
  const pagination = response?.pagination || responseData?.pagination || {};
  const currentPage = Number(pagination.page || page);
  const currentLimit = Number(pagination.limit || limit);
  const total = Number(pagination.total || 0);

  return {
    success: response?.success !== false,
    message: response?.message || "",
    data: toReportArray(responseData),
    summary: response?.summary || responseData?.summary || {},
    filters: response?.filters || responseData?.filters || {},
    pagination: {
      ...pagination,
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Number(pagination.totalPages || Math.ceil(total / currentLimit) || 1),
      start: total ? (currentPage - 1) * currentLimit + 1 : 0,
      end: total ? Math.min(currentPage * currentLimit, total) : 0,
    },
  };
}

export async function fetchExpiryReport(filters = {}, options = {}) {
  return getProductExpiryReport(filters, options);
}
export async function sendAlertToCustomer({customer_id = null , product = {}}) {
  const response = await makeRequest("/reports/product-expiry/sendAlert", {
    method: "POST",
    body: {
      product,
      customer_id
    },
  });

  return response;
}
export function getDefaultProductExpiryCallDescription(row = {}) {
  const productName = row.product_name || row.product?.product_name || "product";
  const serialNumber = row.serial_number || row.product?.serial_number || "";
  const expiryDate = row.expiry_date || row.product?.expiry_date || "";
  const customerName = row.customer_name || row.customer?.name || "customer";
  const serialText = serialNumber ? ` (${serialNumber})` : "";
  const expiryText = expiryDate ? ` expiring on ${expiryDate}` : "";

  return `Product expiry call registered for ${customerName} - ${productName}${serialText}${expiryText}.`;
}

export async function makeToCustomer({customer_id = null , product = {}, description = ""}) {
  const response = await makeRequest("/reports/product-expiry/makeCall", {
    method: "POST",
    body: {
      product,
      customer_id,
      description: String(description || "").trim() || getDefaultProductExpiryCallDescription({ product }),
      call_description: String(description || "").trim() || getDefaultProductExpiryCallDescription({ product }),
    },
  });

  return response;
}

export async function fetchProductActivity({ customer_id = null, product = {} }) {
  const response = await makeRequest("/reports/product-expiry/activity", {
    method: "POST",
    body: {
      customer_id,
      product,
    },
  });

  if (!response?.success) return response;

  const activityData = response.data || {};

  return {
    ...response,
    data: {
      customer: activityData.customer || null,
      calls: activityData.calls || [],
      reminders: activityData.reminders || [],
      counts: activityData.counts || {},
    },
  };
}
