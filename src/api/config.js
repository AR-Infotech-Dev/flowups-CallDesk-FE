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
  
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "http://localhost:3000/api/v1" ;
  // export const API_SERVER_URL = import.meta.env.API_SERVER_URL || "http://192.168.1.23:3000" ;
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "http://192.168.1.23:3000/api/v1" ;
  // export const API_SERVER_URL = import.meta.env.API_SERVER_URL || "http://10.168.243.83:3000" ;
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "http://10.168.243.83:3000/api/v1" ;
  
  // IN NETWORK
  
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "http://192.168.1.23:3000/api/v1" ;
  // export const API_SERVER_URL = import.meta.env.API_SERVER_URL || "https://flowups-be.onrender.com" ;
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "https://flowups-be.onrender.com/api/v1";
  
  // export const API_SERVER_URL = import.meta.env.API_SERVER_URL || "http://192.168.1.23:3000" ;
  // export const API_BASE_URL = import.meta.env.API_BASE_URL || "http://192.168.1.23:3000/api/v1" ;
};