import axios from 'axios';
import { API_BASE_URL, DEFAULT_HEADERS, getDefaultHeaders } from "./config";
import { clearAuthSession, getCurrentSession } from "@auth/utils/authStorage";
import { hideGlobalLoader, showGlobalLoader } from "@context/loaderStore";

const isSuperAdminSession = () => getCurrentSession()?.user?.role_slug === "super_admin";

const isCompanyIdKey = (key = "") => String(key).toLowerCase() === "company_id";

const shouldBypassCompanyIdFilter = (url = "", method = "GET") => {
  const normalizedUrl = String(url || "").toLowerCase();
  const normalizedMethod = String(method || "GET").toUpperCase();
  const normalizedPath = normalizedUrl
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/\/+$/, "");

  if (normalizedPath.includes("/permissions/save/")) return false;

  if (normalizedMethod === "GET") return true;

  if (normalizedMethod === "POST" && ["/users", "/products", "/categories", "/companies", "/menus", "/comments",].includes(normalizedPath)) { return true; }
  // "/customers",
  // "/tickets",
  return ["/list", "searchlist", "searchsluglist", "getdefinations", "get-menus", "get-permissions", "permissions/", "/dashboard", "get-markers", "/notifications",].some((segment) => normalizedUrl.includes(segment));
};

const stripCompanyIdFilterRows = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(stripCompanyIdFilterRows)
      .filter((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return true;
        return !isCompanyIdKey(item.field || item.key || item.name || item.column_name);
      });
  }

  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((accumulator, [key, itemValue]) => {
    accumulator[key] = stripCompanyIdFilterRows(itemValue);
    return accumulator;
  }, {});
};

const stripCompanyIdForSuperAdmin = (payload, url, method) => {
  if (!isSuperAdminSession() || !shouldBypassCompanyIdFilter(url, method) || !payload) return payload;

  if (typeof payload === "string") {
    try {
      return JSON.stringify(stripCompanyIdFilterRows(JSON.parse(payload)));
    } catch {
      return payload;
    }
  }

  return stripCompanyIdFilterRows(payload);
};

export const makeRequest = async (url, options = {}) => {
  try {
    showGlobalLoader();
    const {
      method = "GET",
      headers = {},
      body = null,
      params = null,
      onUploadProgress = null,
      timeout = 10000,
      responseType = "json",
    } = options;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const requestHeaders = {
      ...getDefaultHeaders(),
      ...headers,
    };

    if (isFormData) {
      delete requestHeaders["Content-Type"];
      delete requestHeaders["content-type"];
    }

    const config = {
      url,
      baseURL: API_BASE_URL,
      method,
      timeout,
      withCredentials: true,
      headers: requestHeaders,
      data: isFormData ? body : stripCompanyIdForSuperAdmin(body, url, method),     // for POST, PUT
      params: stripCompanyIdForSuperAdmin(params, url, method), // for GET query params
      onUploadProgress,
      responseType,
    };
    const res = await axios(config);
    if (responseType === "blob") {
      return {
        success: true,
        status: res.status,
        data: res.data,
        headers: res.headers,
      };
    }

    return {
      status: res.status,
      ...res.data
    };
  } catch (error) {
    console.error("Axios Error:", error.response);
    if (error.response) {
      if (error.response.status === 401 && [2006, 2007, 2009].includes(error?.response?.data?.code)) {
        clearAuthSession();
      }
      return {
        ...error.response.data,
        success: false,
        message: error.response.data?.message || "Server error",
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        message: "No response from server",
      };
    } else {
      return {
        success: false,
        message: error.message,
      };
    }
  } finally {
    hideGlobalLoader();
  }
};

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (payload.message || payload.error)) ||
      response.statusText ||
      "Request failed";

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}


