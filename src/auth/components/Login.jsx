import LoginForm from "./forms/LoginForm";
import AuthVisualShell from "./AuthVisualShell";

const Login = () => {
  return (
    <AuthVisualShell
      title="Welcome back"
      subtitle="Please enter your credentials to access your workspace."
    >
      <LoginForm />
    </AuthVisualShell>
  );
};

export default Login;
