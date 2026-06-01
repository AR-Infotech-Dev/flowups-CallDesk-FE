import { API_BASE_URL, DEFAULT_HEADERS, getDefaultHeaders } from "./config";
import axios from 'axios';
import { clearAuthSession } from "../auth/authStorage";
import { hideGlobalLoader, showGlobalLoader } from "../context/loaderStore";

export const makeRequest = async (url, options = {}) => {
  try {
    showGlobalLoader();
    const {
      method = "GET",
      headers = {},
      body = null,
      params = null,
    } = options;
    const config = {
      url,
      baseURL: API_BASE_URL,
      method,
      timeout: 10000,
      withCredentials: true,
      headers: {
        ...getDefaultHeaders(),
        ...headers,
      },
      data: body,     // for POST, PUT
      params: params, // for GET query params
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
