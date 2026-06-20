const AUTH_KEY = "_auth_id";
const USER_KEY = "user";
const PERMISSIONS_KEY = "permissions";
const MENU_KEY = "menus";

export const getUserAuthId = (user = {}) => user?.adminID || "";

const safeJsonParse = (value, fallback = null) => {
  if (!value || value === "undefined") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const saveAuthSession = ({ token, user, authid }) => {
  const resolvedAuthId = authid || getUserAuthId(user);

  localStorage.setItem(AUTH_KEY, resolvedAuthId || "");
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
};

export const savePermissions = (permissions = {}) => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions || {}));
};

export const saveViewMode = (menuName , viewmode) => {
  localStorage.setItem(`${menuName}_viewMode`, viewmode);
};
export const getViewMode = (menuName) => {
  return localStorage.getItem(`${menuName}_viewMode`);
};

export const getStoredPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "{}");
  } catch {
    return {};
  }
};

export const saveMenuList = (menus = []) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(menus || []));
  window.dispatchEvent(new CustomEvent("crm:menus-updated", { detail: menus || [] }));
};

export const getStoredMenuList = () => {
  try {
    return JSON.parse(localStorage.getItem(MENU_KEY) || "[]");
  } catch {
    return [];
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem("_auth_id");
  localStorage.removeItem("user");
  localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(MENU_KEY);
};

export const getCurrentSession = () => {
  const user = safeJsonParse(localStorage.getItem(USER_KEY), null);
  const authid = localStorage.getItem(AUTH_KEY) || getUserAuthId(user);

  if (!user || !authid) return null;

  return {
    user,
    _auth_id: authid,
    authid,
  };
};

export const logoutFromLocalAuth = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(MENU_KEY);
};
