import { API_BASE_URL, DEFAULT_HEADERS, getDefaultHeaders } from "./config";
import axios from 'axios';
import { clearAuthSession, getCurrentSession } from "../auth/authStorage";
import { hideGlobalLoader, showGlobalLoader } from "../context/loaderStore";

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

  if (
    normalizedMethod === "POST" &&
    [
      "/users",
      "/customers",
      "/products",
      "/tickets",
      "/categories",
      "/companies",
      "/menus",
      "/comments",
    ].includes(normalizedPath)
  ) {
    return true;
  }

  return [
    "/list",
    "searchlist",
    "searchsluglist",
    "getdefinations",
    "get-menus",
    "get-permissions",
    "permissions/",
    "/dashboard",
    "get-markers",
    "/notifications",
  ].some((segment) => normalizedUrl.includes(segment));
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
      timeout: 10000,
      withCredentials: true,
      headers: requestHeaders,
      data: isFormData ? body : stripCompanyIdForSuperAdmin(body, url, method),     // for POST, PUT
      params: stripCompanyIdForSuperAdmin(params, url, method), // for GET query params
    };
    const res = await axios(config);

    return {
      status: res.status,
      ...res.data
    };
  } catch (error) {
    console.error("Axios Error:", error.response);
    if (error.response) {
      // AUTO LOGOUT ON 401
      if (error.response.status === 401) {
        clearAuthSession();
        setTimeout(()=>{
          window.location.href = "/login";
        },2000)
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
  } finally{
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


export async function apiRequest(path, options = {}) {
  const { headers, ...restOptions } = options;

  try {
    showGlobalLoader();

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
    });

    return parseResponse(response);
  } finally {
    hideGlobalLoader();
  }
}

export function get(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "GET",
  });
}

export function post(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function put(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patch(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function remove(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "DELETE",
  });
}
