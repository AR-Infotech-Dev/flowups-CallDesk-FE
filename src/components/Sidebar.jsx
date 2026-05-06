import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Accessibility,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ContactRound,
  FileText,
  Folder,
  Gauge,
  LayoutGrid,
  Mail,
  Map,
  MenuSquare,
  NotepadText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
} from "lucide-react";
import { makeRequest } from "../api/httpClient";
import { useAuth } from "../auth/AuthProvider";
import { getStoredPermissions } from "../auth/authStorage";

const iconMap = {
  Accessibility,
  BriefcaseBusiness,
  Building2,
  ContactRound,
  FileText,
  Gauge,
  LayoutGrid,
  Mail,
  Map,
  MenuSquare,
  NotepadText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
};

const getIcon = (iconName) => iconMap[iconName] || Folder;

const getMenuId = (menu = {}) => menu?.menu_id || menu?.menuID || menu?.menuId || menu?.id;
const getMenuLabel = (menu = {}) => menu?.menuName || menu?.menu_name || menu?.label || menu?.module_name || "Menu";
const getMenuLink = (menu = {}) => menu?.menuLink || menu?.menu_link || menu?.path || "";

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
};

const buildPath = (menu = {}) => {
  const link = String(getMenuLink(menu) || "").trim();
  if (!link) return "";
  return link.startsWith("/") ? link : `/${link}`;
};

const canViewMenu = (menu = {}, permissions = {}, bypass = false) => {
  if (bypass) return true;
  const menuId = getMenuId(menu);
  if (!menuId) return false;
  const permission = permissions[String(menuId)] || permissions[menuId] || {};
  return toBoolean(permission.view ?? permission.can_view);
};

const buildSidebar = (menus = [], permissions = {}, bypass = false) =>
  menus
    .map((parent) => {
      const children = parent?.subMenu || parent?.submenu || parent?.children || [];
      const visibleChildren = children
        .filter((child) => canViewMenu(child, permissions, bypass))
        .map((child) => ({
          id: getMenuId(child),
          label: getMenuLabel(child),
          path: buildPath(child),
          icon: getIcon(child.iconName),
        }))
        .filter((item) => item.path);

      const parentVisible = canViewMenu(parent, permissions, bypass);
      const parentPath = buildPath(parent);

      if (!parentVisible && visibleChildren.length === 0) return null;
      if (!parentPath && visibleChildren.length === 0) return null;

      return {
        id: getMenuId(parent),
        title: getMenuLabel(parent),
        path: parentPath,
        icon: getIcon(parent.iconName),
        items: visibleChildren,
        isVisibleRoute: parentVisible && Boolean(parentPath),
      };
    })
    .filter(Boolean);

function Sidebar({ onSelectModule }) {
  const { authSession } = useAuth();
  const roleSlug = authSession?.user?.role_slug;
  const canBypass = roleSlug === "super_admin";
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const permissions = useMemo(() => getStoredPermissions(), [authSession]);

  const sidebarGroups = useMemo(
    () => buildSidebar(menus, permissions, canBypass),
    [menus, permissions, canBypass]
  );

  const fetchMenus = async () => {
    try {
      setLoading(true);
      let res = await makeRequest("/menus/getMenuList", {
        method: "GET",
      });

      if (!res?.success) {
        res = await makeRequest("/menus", {
          method: "POST",
          body: { getAll: "Y" },
        });
      }

      setMenus(res?.success ? res.data || [] : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    const nextCollapsed = {};
    sidebarGroups.forEach((group) => {
      nextCollapsed[group.id] = false;
    });
    setCollapsedGroups(nextCollapsed);
  }, [sidebarGroups.length]);

  return (
    <aside className="sidebar">
      <div className="sidebar-sections">
        <section className="sidebar-group">
          <div className="sidebar-group-title px-2">Main Menu</div>

          <div className="sidebar-group-items">
            {loading && <div className="p-3 text-xs text-slate-500">Loading menu...</div>}
            {!loading && sidebarGroups.length === 0 && (
              <div className="p-3 text-xs text-slate-500">No menu access</div>
            )}
            {!loading &&
              sidebarGroups.map((group) => {
                const Icon = group.icon;
                const isCollapsed = collapsedGroups[group.id];

                if (group.items.length) {
                  return (
                    <div key={group.id} className="sidebar-group">
                      <button
                        type="button"
                        className="sidebar-group-title sidebar-group-toggle"
                        onClick={() =>
                          setCollapsedGroups((current) => ({
                            ...current,
                            [group.id]: !current[group.id],
                          }))
                        }
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={16} /> {group.title}
                        </span>
                        <ChevronDown size={14} className={isCollapsed ? "is-collapsed" : ""} />
                      </button>

                      {!isCollapsed && (
                        <div className="sidebar-group-items">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <NavLink
                                key={item.id}
                                to={item.path}
                                className="no-underline"
                                onClick={() => onSelectModule?.(item.path)}
                              >
                                {({ isActive }) => (
                                  <button className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                                    <span className="sidebar-icon">
                                      <ItemIcon size={16} />
                                    </span>
                                    <span>{item.label}</span>
                                  </button>
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={group.id}
                    to={group.path}
                    className="no-underline"
                    onClick={() => onSelectModule?.(group.path)}
                  >
                    {({ isActive }) => (
                      <button className={`sidebar-item w-full ${isActive ? "active" : ""}`}>
                        <span className="sidebar-icon">
                          <Icon size={16} />
                        </span>
                        <span>{group.title}</span>
                      </button>
                    )}
                  </NavLink>
                );
              })}
          </div>
        </section>
      </div>

      <div className="sync-card">
        <div className="sync-ring" />
        <div>
          <div className="sync-title">CRM Connected</div>
          <div className="sync-subtitle">Permission menu loaded</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
