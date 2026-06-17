import { makeRequest } from "../../../api/httpClient";

export const defaultProductExpiryFilters = {
  company_id: "",
  customer_id: "",
  product_id: "",
  expiry_status: "all",
  from_date: "",
  to_date: "",
  expiring_days: 30,
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.list)) return value.list;
  return [];
};

const pick = (item = {}, keys = []) => {
  const matchedKey = keys.find((key) => item[key] !== undefined && item[key] !== null);
  return matchedKey ? item[matchedKey] : "";
};

const normalizeOption = (item = {}, valueKeys, labelKeys) => ({
  value: String(pick(item, valueKeys) || ""),
  label: String(pick(item, labelKeys) || "Unnamed"),
});

export async function fetchExpiryReport(filters = {}, options = {}) {
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

  const pagination = response?.pagination || {};
  const currentPage = Number(pagination.page || page);
  const currentLimit = Number(pagination.limit || limit);
  const total = Number(pagination.total || 0);

  return {
    success: response?.success !== false,
    message: response?.message || "",
    data: asArray(response?.data),
    summary: response?.summary || {},
    filters: response?.filters || {},
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
