import { Navigate, Route, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import Login from "../auth/Login";
import Feedback from "../public/Feedback";
import ForgotPasswordPage from "../auth/ForgotPasswordPage";
import VerificationPage from "../auth/VerificationPage";
import { makeRequest } from "../api/httpClient";

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
  const { authSession } = useAuth();
  const [forgotForm, setForgotForm] = useState({ email: "" });
  const [authError, setAuthError] = useState("");
  const [authHelperText, setAuthHelperText] = useState("");

  if (authSession) {
    return <Navigate to="/dashboard" replace />;
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
      onSubmit={async (event) => {
        event.preventDefault();
        setAuthError("");
        setAuthHelperText("");
        const result = await makeRequest("forgotPassword", {
          method: "POST",
          body: { email: forgotForm.email },
        });

        if (!result?.success) {
          setAuthError(result?.message || "Unable to send verification code");
          return;
        }

        setAuthHelperText(result?.message || "Verification code sent successfully");
        navigate("/verify-reset", { state: { email: forgotForm.email } });
      }}
      onBack={() => {
        navigate("/login");
      }}
    />
  );
}

function VerificationRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authSession } = useAuth();
  const [verificationForm, setVerificationForm] = useState({
    email: location.state?.email || "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState("");
  const [authHelperText, setAuthHelperText] = useState("");

  if (authSession) {
    return <Navigate to="/dashboard" replace />;
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
      onSubmit={async (event) => {
        event.preventDefault();
        setAuthError("");
        setAuthHelperText("");

        if (verificationForm.password !== verificationForm.confirmPassword) {
          setAuthError("New password and confirm password must match");
          return;
        }

        const result = await makeRequest("verifyOtp", {
          method: "POST",
          body: {
            otp: verificationForm.code,
            new_password: verificationForm.password,
            re_enter_password: verificationForm.confirmPassword,
          },
        });

        if (!result?.success) {
          setAuthError(result?.message || "Unable to reset password");
          return;
        }

        setAuthHelperText(result?.message || "Password updated successfully");
        navigate("/login");
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
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route path="/verify-reset" element={<VerificationRoute />} />
      <Route path="/feedback/:ticket_id/:token" element={<Feedback />} />
    </>
  );
}
