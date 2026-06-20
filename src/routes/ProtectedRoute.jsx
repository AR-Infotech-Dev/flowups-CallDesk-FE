import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentSession } from "@auth/utils/authStorage";

function ProtectedRoute() {
  const location = useLocation();
  const session = getCurrentSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
