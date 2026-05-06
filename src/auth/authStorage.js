const TOKEN_KEY = "_bb_key";
const AUTH_KEY = "_auth_id";
const USER_KEY = "user";
const PERMISSIONS_KEY = "permissions";

export const saveAuthSession = ({ token, user ,authid}) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(AUTH_KEY, authid);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const savePermissions = (permissions = {}) => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions || {}));
};

export const getStoredPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "{}");
  } catch {
    return {};
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem("_bb_key");
  localStorage.removeItem("_auth_id");
  localStorage.removeItem("user");
  localStorage.removeItem(PERMISSIONS_KEY);
};

export const getCurrentSession = () => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) return null;

  return {
    token,
    user: JSON.parse(localStorage.getItem(USER_KEY) || "{}"),
    _auth_id: JSON.parse(localStorage.getItem(AUTH_KEY) || null)
  };
};

export const logoutFromLocalAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
};
