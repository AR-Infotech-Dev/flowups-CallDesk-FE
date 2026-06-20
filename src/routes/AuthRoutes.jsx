import { Navigate, Route } from "react-router-dom";
import { useAuth } from "@auth/components/AuthProvider";
import Login from "@/auth/components/Login";
import Feedback from "../public/Feedback";
import MarkVisit from "../public/MarkVisit";
import ForgotPassword from "@auth/components/ForgotPassword";
import Verification from "@auth/components/Verification";

function PublicAuthRoute({ children }) {
  const { authSession } = useAuth();
  if (authSession) { return <Navigate to="/dashboard" replace />; }
  return children;
}
export function getAuthRoutes() {
  return (
    <>
      <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
      <Route path="/forgot-password" element={<PublicAuthRoute><ForgotPassword /></PublicAuthRoute>} />
      <Route path="/verify-reset" element={<PublicAuthRoute><Verification /></PublicAuthRoute>} />
      <Route path="/feedback/:ticket_id/:token" element={<Feedback />} />
      <Route path="/mark_visit/:visit_id/:token" element={<MarkVisit />} />
    </>
  );
}
