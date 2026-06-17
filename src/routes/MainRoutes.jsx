import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { getAuthRoutes } from "./AuthRoutes";
import { useAuth } from "../auth/AuthProvider";
import { getCurrentSession, getStoredMenuList, getStoredPermissions, saveMenuList } from "../auth/authStorage";
import { fetchMenuList, flattenMenus, getFirstAllowedPath, getMenuId, getMenuLink, normalizePath } from "../auth/permissions";
import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";

const AppLayout = lazy(() => import("../layouts/AppLayout"));
const Dashboard = lazy(() => import("../modules/dashboard/Dashboard"));
const UsersModulePage = lazy(() => import("../modules/users/UsersModulePage"));
const TicketsModulePage = lazy(() => import("../modules/tasks/TicketsModulePage"));
const MenuMasterModulePage = lazy(() => import("../modules/menu-master/MenuMasterModulePage"));
const CustomerModulePage = lazy(() => import("../modules/customer/CustomerModulePage"));
const AmcRemindersModulePage = lazy(() => import("../modules/amc-reminders/AmcRemindersModulePage"));
const CategoryModulePage = lazy(() => import("../modules/category/CategoryModulePage"));
const ProductModulePage = lazy(() => import("../modules/products/ProductModulePage"));
const CompanyMasterModulePage = lazy(() => import("../modules/company-master/CompanyMasterModulePage"));
const AccessControlModulePage = lazy(() => import("../modules/access-control/AccessControlModulePage"));
const PerformanceReportPage = lazy(() => import("../modules/reports/PerformanceReportPage"));
const UserPerformancePage = lazy(() => import("../modules/reports/UserPerformancePage"));
const WorkReportModulePage = lazy(() => import("../modules/work-report/WorkReportModulePage"));
const CustomerReport = lazy(() => import("../modules/customer/components/CustomerReport"));
const ProductExpiryReport = lazy(() => import("../modules/products/ProductExpiryReport"));
const UserMarkers = lazy(() => import("../modules/dashboard/UserMarkers"));
const UserProfilePage = lazy(() => import("../modules/profile/UserProfilePage"));

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
  "/amc-reminders": AmcRemindersModulePage,
  "/amc-reminder": AmcRemindersModulePage,
  "/products": ProductModulePage,
  "/product": ProductModulePage,
  "/categories": CategoryModulePage,
  "/category": CategoryModulePage,
  "/user-markers": UserMarkers,
  "/companies": CompanyMasterModulePage,
  "/companyMaster": CompanyMasterModulePage,
  "/company-master": CompanyMasterModulePage,
  "/access-control": AccessControlModulePage,
  "/reports/performance": PerformanceReportPage,
  "/work-report": WorkReportModulePage,
  "/reports/work-report": WorkReportModulePage,
  "/reports/product-expiry": ProductExpiryReport,
  "/reports/product-expiry-report": ProductExpiryReport,
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

function PageLoader() {
  return <div className="p-6 text-sm text-slate-500">Loading page...</div>;
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
  const location = useLocation();
  const storedMenus = getStoredMenuList();
  const [menus, setMenus] = useState(() => storedMenus);
  const [loadingMenus, setLoadingMenus] = useState(!storedMenus.length);
  const { authSession } = useAuth();

  useEffect(() => {
    const syncMenus = (event) => {
      const nextMenus = event?.detail || getStoredMenuList();
      setMenus(nextMenus);
      setLoadingMenus(false);
    };

    window.addEventListener("crm:menus-updated", syncMenus);
    return () => window.removeEventListener("crm:menus-updated", syncMenus);
  }, []);

  useEffect(() => {
    const loadMenus = async () => {
      if (location.pathname === "/login" || location.pathname.startsWith("/feedback/") || location.pathname.startsWith("/mark_visit/")) {
        setLoadingMenus(false);
        return;
      }

      if (!getCurrentSession()) {
        setMenus([]);
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
        const nextMenus = await fetchMenuList("ithech mainroutes madhe", {
          fallbackPermissions: getStoredPermissions(),
        });
        saveMenuList(nextMenus);
        setMenus(nextMenus);
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenus();
  }, [authSession, location.pathname]);

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

  const performanceReportMenuId = useMemo(() => {
    const reportMenu = flattenMenus(menus).find((menu) => normalizePath(getMenuLink(menu)) === "/reports/performance");
    return getMenuId(reportMenu);
  }, [menus]);
  const workReportMenuId = useMemo(() => {
    const reportMenu = flattenMenus(menus).find((menu) => ["/work-report", "/reports/work-report"].includes(normalizePath(getMenuLink(menu))));
    return getMenuId(reportMenu);
  }, [menus]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DefaultMenuRedirect />} />
        {getAuthRoutes()}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<UserProfilePage />} />
            <Route
              path="/reports/performance"
              element={
                performanceReportMenuId
                  ? withPermission(performanceReportMenuId, <PerformanceReportPage menu_id={performanceReportMenuId} />)
                  : <PerformanceReportPage menu_id={performanceReportMenuId} />
              }
            />
            <Route
              path="/reports/performance/:userId"
              element={
                performanceReportMenuId
                  ? withPermission(performanceReportMenuId, <UserPerformancePage menu_id={performanceReportMenuId} />)
                  : <UserPerformancePage menu_id={performanceReportMenuId} />
              }
            />
            <Route
              path="/work-report"
              element={
                workReportMenuId
                  ? withPermission(workReportMenuId, <WorkReportModulePage menu_id={workReportMenuId} />)
                  : <WorkReportModulePage menu_id={workReportMenuId} />
              }
            />
            <Route
              path="/reports/work-report"
              element={
                workReportMenuId
                  ? withPermission(workReportMenuId, <WorkReportModulePage menu_id={workReportMenuId} />)
                  : <WorkReportModulePage menu_id={workReportMenuId} />
              }
            />
            <Route path="/customer/report/:customerId" element={<CustomerReport />} />
            <Route path="/dashboard/product-expiry" element={<ProductExpiryReport />} />
            {dynamicRoutes.map((route) => (
              <Route key={`${route.path}-${route.menuId}`} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<RouteFallback loading={loadingMenus} />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default MainRoutes;
