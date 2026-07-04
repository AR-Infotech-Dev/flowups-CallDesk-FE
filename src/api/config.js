export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || "http://localhost:3000";
export const API_BASE_URL = `${API_SERVER_URL}/api/v1` || "http://localhost:3000/api/v1";
export const APP_NAME = import.meta.env.APP_NAME || "FlowupS CallDesk" ;

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  'Accept': 'application/json',
  'authid': localStorage.getItem("_auth_id")
};

export const getDefaultHeaders = () => {
  const authid = localStorage.getItem("_auth_id");

  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "authid": authid || ""
  };
};