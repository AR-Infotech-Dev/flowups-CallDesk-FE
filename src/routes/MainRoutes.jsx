import { Routes, Route, Navigate } from "react-router-dom";
import { UsersModulePage } from "../modules/users";
import { AccessControlModulePage } from "../modules/access-control";
import { MenuMasterModulePage} from "../modules/menu-master";
import { TicketsModulePage } from "../modules/tasks";
import { CategoryModulePage } from "../modules/category";
import { CustomerModulePage } from "../modules/customer";
import { CompanyMasterModulePage } from "../modules/company-master";
import UserMarkers from '../modules/dashboard/UserMarkers'
// import { UserRoleMasterModulePage } from "../modules/user-role-master";
// import { UsersRoleModulePage } from "../modules/users-role";
import { getAuthRoutes } from "./AuthRoutes";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

function MainRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/users" replace />} />
      {getAuthRoutes()}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/tickets" element={<TicketsModulePage menu_id={322} />} />
          <Route path="/menus" element={<MenuMasterModulePage menu_id={323} />} />
          <Route path="/customers" element={<CustomerModulePage menu_id={324} />} />
          <Route path="/users" element={<UsersModulePage menu_id={325} />} />
          <Route path="/category" element={<CategoryModulePage menu_id={326} />} />
          <Route path="/user-markers" element={<UserMarkers menu_id={327} />} />
          <Route path="/companyMaster" element={<CompanyMasterModulePage menu_id={328} />} />
          <Route path="/access-control" element={<AccessControlModulePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default MainRoutes;
