import AuthVisualShell from "./AuthVisualShell";
import ForgotPasswordForm from "./forms/ForgotPasswordForm";

const ForgotPassword = () => {
  return (
    <AuthVisualShell
      title="Forgot password"
      subtitle="Enter your email to receive a verification code."
    >
      <ForgotPasswordForm />
    </AuthVisualShell>
  );
};

export default ForgotPassword;
