import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../auth/AuthProvider";

function AppLayout() {
  const { logout } = useAuth();

  return (
    <AppShell 
      topbar={<TopBar onLogout={logout} />} 
      sidebar={<Sidebar />}>
      <Outlet />
    </AppShell>
  );
}

export default AppLayout;
