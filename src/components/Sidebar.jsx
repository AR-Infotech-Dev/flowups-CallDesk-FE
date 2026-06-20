import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Accessibility, BriefcaseBusiness, Building2, ChevronDown, ContactRound, FileText, Folder, Gauge, LayoutGrid, Mail, Map, MenuSquare, NotepadText, Package, ShieldCheck, Sparkles, Ticket, Users, Workflow, } from "lucide-react";
import { useAuth } from "@auth/components/AuthProvider";
import { APP_NAME } from "@api/config";
import { getStoredMenuList, getStoredPermissions } from "@auth/utils/authStorage";
import { buildAllowedMenuTree, getMenuId, getMenuLabel, getMenuLink, normalizePath, } from "@auth/utils/permissions";

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
  Package,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
};

const getIcon = (iconName) => iconMap[iconName] || Folder;

const buildSidebar = (menus = [], permissions = {}, user = {}) =>
  buildAllowedMenuTree(menus, permissions, user).map((parent) => {
    const children = parent?.subMenu || parent?.submenu || parent?.children || [];
    const visibleChildren = children.map((child) => ({
      id: getMenuId(child),
      label: getMenuLabel(child),
      path: normalizePath(getMenuLink(child)),
      icon: getIcon(child.iconName),
    }))
      .filter((item) => item.path);

    const parentPath = normalizePath(getMenuLink(parent));

    if (!parentPath && visibleChildren.length === 0) return null;

    return {
      id: getMenuId(parent),
      title: getMenuLabel(parent),
      path: parentPath,
      icon: getIcon(parent.icon_name),
      items: visibleChildren,
    };
  })
    .filter(Boolean);

function Sidebar({ onSelectModule }) {
  const { authSession } = useAuth();
  const [menus, setMenus] = useState(() => getStoredMenuList());
  const [loading, setLoading] = useState(() => !getStoredMenuList().length);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const permissions = useMemo(() => getStoredPermissions(), [authSession]);
  const sidebarGroups = useMemo(
    () => buildSidebar(menus, permissions, authSession?.user),
    [menus, permissions, authSession?.user]
  );

  useEffect(() => {
    const syncMenus = (event) => {
      const nextMenus = event?.detail || getStoredMenuList();
      setMenus(nextMenus);
      setLoading(false);
    };

    const storedMenus = getStoredMenuList();
    if (storedMenus.length) {
      setMenus(storedMenus);
      setLoading(false);
    }

    window.addEventListener("crm:menus-updated", syncMenus);
    return () => window.removeEventListener("crm:menus-updated", syncMenus);
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
      <div className="sidebar-brand" title={APP_NAME}>
        <img
          // src="/logo 1.png"
          src="/logo 1 (1).png"
          alt={APP_NAME}
          className="sidebar-logo"
        />
        <span className="sidebar-brand-fallback">{APP_NAME}</span>
      </div>

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

      {/* <div className="sync-card">
        <div className="sync-ring" />
        <div>
          <div className="sync-title">CRM Connected</div>
          <div className="sync-subtitle">Permission menu loaded</div>
        </div>
      </div> */}
    </aside>
  );
}

export default Sidebar;
