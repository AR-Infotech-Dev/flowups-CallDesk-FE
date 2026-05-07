import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getFirstAllowedPath, hasMenuViewPermission } from "../auth/permissions";

function PermissionRoute({ menuId, children }) {
  const location = useLocation();
  const { authSession } = useAuth();
  const allowed = hasMenuViewPermission({
    menuId,
    pathname: location.pathname,
    user: authSession?.user,
  });
  
  if (allowed) return children;

  const fallbackPath = getFirstAllowedPath({ user: authSession?.user });
  if (fallbackPath && fallbackPath !== location.pathname) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <div className="max-w-sm rounded-md border border-slate-200 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-900">No Permission</h2>
        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}

export default PermissionRoute;
