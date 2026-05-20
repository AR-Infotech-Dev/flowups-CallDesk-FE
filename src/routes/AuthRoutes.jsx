import { Navigate, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Login from "../auth/Login";
import Feedback from "../public/Feedback";

function LoginRoute() {
  const navigate = useNavigate();
  const { authSession, authError, authHelperText, loginForm, setLoginForm, setForgotForm, login} = useAuth();
  
  if (authSession) {
    return <Navigate to="/dashboard" replace />;
  }
  

  return (
    <Login/>
  );
}

function ForgotPasswordRoute() {
  const navigate = useNavigate();
  const {
    authSession,
    authError,
    authHelperText,
    forgotForm,
    setForgotForm,
    requestPasswordReset,
  } = useAuth();

  if (authSession) {
    return <Navigate to="/users" replace />;
  }

  return (
    <ForgotPasswordPage
      formData={forgotForm}
      error={authError}
      helperText={authHelperText}
      onChange={(event) => {
        const { name, value } = event.target;
        setForgotForm((prev) => ({ ...prev, [name]: value }));
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const result = requestPasswordReset(forgotForm.email);
        if (result?.success) {
          navigate("/verify-reset");
        }
      }}
      onBack={() => {
        navigate("/login");
      }}
    />
  );
}

function VerificationRoute() {
  const navigate = useNavigate();
  const {
    authSession,
    authError,
    authHelperText,
    verificationForm,
    setVerificationForm,
    verifyReset,
  } = useAuth();

  if (authSession) {
    return <Navigate to="/users" replace />;
  }

  return (
    <VerificationPage
      formData={verificationForm}
      error={authError}
      helperText={authHelperText}
      onChange={(event) => {
        const { name, value } = event.target;
        setVerificationForm((prev) => ({ ...prev, [name]: value }));
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const result = verifyReset(verificationForm);
        if (result?.success) {
          navigate("/login");
        }
      }}
      onBack={() => {
        navigate("/forgot-password");
      }}
    />
  );
}

export function getAuthRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/feedback/:ticket_id/:token" element={<Feedback />} />
    </>
  );
}
