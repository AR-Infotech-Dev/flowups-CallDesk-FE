import { accessModules, accessPermissionColumns } from "./accessControlData";
import { getSchemaFieldsForMenu } from "./moduleSchemaRegistry";

export const getUserId = (user = {}) => {
    return user?.adminID || user?.id || user?._id || user?.user_id;
}

export const getInitials = (name = "") => {
    return String(name || "User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

export const normalizeUserIdentity = (user = {}) => {
    const name = user?.name || user?.userName || user?.email || "Unnamed User";
    const companyId = user?.company_id || user?.default_company || user?.companyID || "";

    return {
        ...user,
        id: getUserId(user),
        name,
        email: user?.email || "",
        role: user?.roleName || user?.role_name || user?.roleID || "User",
        badge: user?.roleName || user?.role_name || "USER",
        initials: getInitials(name),
        company_id: companyId,
        companyLabel: user?.company_name || user?.default_company_name || companyId || "Not assigned",
    };
}

export const slugify = (value = "") => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^\/+/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export const getMenuId = (menu = {}) => {
    return menu?.menu_id || menu?.id || menu?.menuID || menu?.menuId;
}

export const getMenuName = (menu = {}) => {
    return menu?.menuName || menu?.menu_name || menu?.module_name || menu?.label || "Untitled Menu";
}

export const normalizeMenuModule = (menu = {}, isChild = false, parent = null) => {
    const menuId = getMenuId(menu);
    const name = getMenuName(menu);
    const moduleKey = slugify(menu?.module_name);

    return {
        id: String(menuId || moduleKey || name),
        menu_id: menuId,
        parent_id: parent ? getMenuId(parent) : menu?.parentID || menu?.parent_id || 0,
        menu_link: menu?.menuLink || menu?.menu_link || menu?.path || "",
        module_name: menu?.module_name || menu?.moduleName || "",
        table_name: menu?.table_name || menu?.tableName || "",
        name: isChild && parent ? `${getMenuName(parent)} / ${name}` : name,
        icon: accessModules.find((module) => module.id === moduleKey)?.icon || accessModules[0].icon,
        supports: { view: true, add: true, edit: true, delete: true },
        permissions: { view: false, add: false, edit: false, delete: false },
        fields: getSchemaFieldsForMenu(menu),
    };
}

export const flattenMenuModules = (menus = []) => {
    return menus.flatMap((menu) => [
        normalizeMenuModule(menu),
        ...(menu?.subMenu || menu?.submenu || menu?.children || []).map((child) =>
            normalizeMenuModule(child, true, menu)
        ),
    ]);
}
