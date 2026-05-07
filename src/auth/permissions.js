import { getStoredMenuList, getStoredPermissions } from "./authStorage";
import { makeRequest } from "../api/httpClient";

let menuListRequest = null;
let menuListForbidden = false;

export const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
};

export const normalizePath = (value = "") => {
  const path = String(value || "").trim();
  if (!path) return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "/";
};

export const getMenuId = (menu = {}) => menu?.menu_id || menu?.menuID || menu?.menuId || menu?.id;
export const getMenuLabel = (menu = {}) => menu?.menuName || menu?.menu_name || menu?.label || menu?.module_name || "Menu";
export const getMenuLink = (menu = {}) => menu?.menuLink || menu?.menu_link || menu?.path || "";

export const flattenMenus = (menus = []) =>
  menus.flatMap((menu) => [
    menu,
    ...(menu?.subMenu || menu?.submenu || menu?.children || []).flatMap((child) => flattenMenus([child])),
  ]);

export const findMenuByPath = (pathname, menus = getStoredMenuList()) => {
  const currentPath = normalizePath(pathname);
  return flattenMenus(menus).find((menu) => normalizePath(getMenuLink(menu)) === currentPath) || null;
};

export const hasMenuViewPermission = ({ menuId, pathname, user } = {}) => {
  const roleSlug = user?.role_slug;
  if (roleSlug === "super_admin") return true;

  const resolvedMenuId = menuId || getMenuId(findMenuByPath(pathname));
  if (!resolvedMenuId) return false;

  const permissions = getStoredPermissions();
  const permission = permissions[String(resolvedMenuId)] || permissions[resolvedMenuId] || {};

  return toBoolean(permission.view ?? permission.can_view);
};

export const getMenuPermission = (menuId) => {
  if (!menuId) return {};
  const permissions = getStoredPermissions();
  return permissions[String(menuId)] || permissions[menuId] || {};
};

export const hasMenuActionPermission = ({ menuId, action, user } = {}) => {
  if (user?.role_slug === "super_admin") return true;

  // Same helper is used for add/edit/delete buttons, so every page reads permission in one simple way.
  const permission = getMenuPermission(menuId);
  return toBoolean(permission[action] ?? permission[`can_${action}`]);
};

const normalizeFieldKey = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toLowerCase();

export const getFieldPermission = ({ menuId, field } = {}) => {
  const permission = getMenuPermission(menuId);
  const fields = Array.isArray(permission.fields) ? permission.fields : [];

  if (!fields.length) return null;

  const fieldKeys = [
    field?.field_id,
    field?.fieldID,
    field?.id,
    field?._id,
    field?.name,
    field?.key,
    field?.value,
    field?.field_name,
    field?.fieldName,
    field?.column_name,
    field?.label,
  ].map(normalizeFieldKey);

  return fields.find((item) => {
    const savedKeys = [
      item?.field_id,
      item?.fieldID,
      item?.id,
      item?.name,
      item?.key,
      item?.field_name,
      item?.fieldName,
      item?.column_name,
      item?.label,
    ].map(normalizeFieldKey);

    return savedKeys.some((key) => key && fieldKeys.includes(key));
  }) || null;
};

export const hasFieldVisiblePermission = ({ menuId, field, user } = {}) => {
  if (user?.role_slug === "super_admin") return true;

  const permission = getMenuPermission(menuId);
  const fields = Array.isArray(permission.fields) ? permission.fields : [];
  if (!fields.length) return true;

  const fieldPermission = getFieldPermission({ menuId, field });
  if (!fieldPermission) return true;

  return toBoolean(fieldPermission.visible ?? fieldPermission.can_view ?? fieldPermission.enabled);
};

export const hasFieldEditablePermission = ({ menuId, field, user } = {}) => {
  if (user?.role_slug === "super_admin") return true;

  const permission = getMenuPermission(menuId);
  const fields = Array.isArray(permission.fields) ? permission.fields : [];
  if (!fields.length) return true;

  const fieldPermission = getFieldPermission({ menuId, field });
  if (!fieldPermission) return true;

  return toBoolean(fieldPermission.editable ?? fieldPermission.can_edit);
};

export const getFirstAllowedPath = ({ user } = {}) => {
  const menus = flattenMenus(getStoredMenuList());
  const first = menus.find((menu) =>
    normalizePath(getMenuLink(menu)) && hasMenuViewPermission({ menuId: getMenuId(menu), user })
  );
  return first ? normalizePath(getMenuLink(first)) : "";
};

export const normalizePermissionMap = (payload = {}) => {
  const source = payload?.permissions || payload?.data?.permissions || payload?.data || payload;

  if (Array.isArray(source)) {
    return source.reduce((accumulator, item) => {
      const menuId = item?.menu_id || item?.menuID || item?.menuId || item?.id;
      if (menuId) accumulator[String(menuId)] = item;
      return accumulator;
    }, {});
  }

  return source && typeof source === "object" ? source : {};
};

export const fetchUserPermissions = async (userId) => {
  if (!userId) return {};

  const res = await makeRequest(`/permissions/${userId}`, {
    method: "GET",
  });

  return res?.success ? normalizePermissionMap(res) : {};
};

export const fetchMenuList = async (msg) => {
  const storedMenus = getStoredMenuList();
  if (storedMenus.length) return storedMenus;
  if (menuListForbidden) return [];

  if (menuListRequest) return menuListRequest;

  menuListRequest = (async () => {
    const res = await makeRequest("/menus", {
      method: "POST",
      body: { getAll: "Y" },
    });

    if (res?.success) return res.data || [];

    // If backend says current user cannot view Menu Master,
    // do not keep calling /menus again and again in the same app session.
    if (res?.type === "FORBIDDEN" || res?.code === 2007 || res?.status === 403) {
      menuListForbidden = true;
    }

    return [];
  })();

  try {
    return await menuListRequest;
  } finally {
    menuListRequest = null;
  }
};

export const canViewMenu = (menu = {}, permissions = getStoredPermissions(), user = {}) => {
  if (user?.role_slug === "super_admin") return true;

  const menuId = getMenuId(menu);
  if (!menuId) return false;

  const permission = permissions[String(menuId)] || permissions[menuId] || {};
  return toBoolean(permission.view ?? permission.can_view);
};

export const buildAllowedMenuTree = (menus = [], permissions = getStoredPermissions(), user = {}) =>
  menus
    .map((menu) => {
      const children = menu?.subMenu || menu?.submenu || menu?.children || [];
      const allowedChildren = children.filter((child) => canViewMenu(child, permissions, user));
      const parentAllowed = canViewMenu(menu, permissions, user);

      if (!parentAllowed && allowedChildren.length === 0) return null;

      return {
        ...menu,
        subMenu: allowedChildren,
      };
    })
    .filter(Boolean);
