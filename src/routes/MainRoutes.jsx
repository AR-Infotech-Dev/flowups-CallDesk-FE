import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { UsersModulePage } from "../modules/users";
import { AccessControlModulePage } from "../modules/access-control";
import { MenuMasterModulePage } from "../modules/menu-master";
import { TicketsModulePage } from "../modules/tasks";
import { CategoryModulePage } from "../modules/category";
import { CustomerModulePage } from "../modules/customer";
import { CompanyMasterModulePage } from "../modules/company-master";
import { getAuthRoutes } from "./AuthRoutes";
import { useAuth } from "../auth/AuthProvider";
import { getStoredMenuList, saveMenuList } from "../auth/authStorage";
import { fetchMenuList, flattenMenus, getFirstAllowedPath, getMenuId, getMenuLink, normalizePath } from "../auth/permissions";
import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";
import Dashboard from "../modules/dashboard/Dashboard";
import UserMarkers from "../modules/dashboard/UserMarkers";
import AppLayout from "../layouts/AppLayout";

const withPermission = (menuId, element) => (
  <PermissionRoute menuId={menuId}>{element}</PermissionRoute>
);

// Frontend needs to know which component should open for each menuLink.
// The route path and menu_id still come from the API menu list.
const menuRouteComponents = {
  "/dashboard": Dashboard,
  "/users": UsersModulePage,
  "/tickets": TicketsModulePage,
  "/menus": MenuMasterModulePage,
  "/customers": CustomerModulePage,
  "/categories": CategoryModulePage,
  "/category": CategoryModulePage,
  "/user-markers": UserMarkers,
  "/companies": CompanyMasterModulePage,
  "/companyMaster": CompanyMasterModulePage,
  "/company-master": CompanyMasterModulePage,
  "/access-control": AccessControlModulePage,
};

function DefaultMenuRedirect() {
  const { authSession } = useAuth();
  const fallbackPath = getFirstAllowedPath({ user: authSession?.user });

  if (fallbackPath) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!authSession) {
    return <Navigate to="/login" replace />;
  }

  return <NoMenuPermission />;
}

function RouteFallback({ loading }) {
  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading menu...</div>;
  }
  return <DefaultMenuRedirect />;
}

function NoMenuPermission() {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <div className="max-w-sm rounded-md border border-slate-200 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-900">No Menu Permission</h2>
        <p className="mt-2 text-sm text-slate-500">
          You are logged in, but no menu view permission is available for this user.
        </p>
      </div>
    </div>
  );
}

function MainRoutes() {
  const storedMenus = getStoredMenuList();
  const [menus, setMenus] = useState(() => storedMenus);
  const [loadingMenus, setLoadingMenus] = useState(!storedMenus.length);

  useEffect(() => {
    const loadMenus = async () => {
      if (!window.localStorage.getItem("_bb_key")) {
        setLoadingMenus(false);
        return;
      }

      try {
        setLoadingMenus(true);
        const stored = getStoredMenuList();
        if (stored.length) {
          setMenus(stored);
          return;
        }
        const nextMenus = await fetchMenuList('ithech mainroutes madhe');
        saveMenuList(nextMenus);
        setMenus(nextMenus);
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenus();
  }, []);

  const dynamicRoutes = useMemo(
    () =>
      flattenMenus(menus)
        .map((menu) => {
          const path = normalizePath(getMenuLink(menu));
          const menuId = getMenuId(menu);
          const PageComponent = menuRouteComponents[path];

          if (!path || !menuId || !PageComponent) return null;

          return {
            path,
            menuId,
            element: withPermission(menuId, <PageComponent menu_id={menuId} />),
          };
        })
        .filter(Boolean),
    [menus]
  );

  return (
    <Routes>
      <Route path="/" element={<DefaultMenuRedirect />} />
      {getAuthRoutes()}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {dynamicRoutes.map((route) => (
            <Route key={`${route.path}-${route.menuId}`} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<RouteFallback loading={loadingMenus} />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default MainRoutes;
