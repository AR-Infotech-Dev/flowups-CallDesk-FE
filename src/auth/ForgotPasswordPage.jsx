import AuthShell from "./AuthShell";

function ForgotPasswordPage({
  formData,
  error,
  helperText,
  onChange,
  onSubmit,
  onBack,
}) {
  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email to receive a verification code and continue."
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            className="auth-input"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="Enter your email"
            autoComplete="off"
          />
        </label>

        {error ? <div className="auth-message error">{error}</div> : null}
        {helperText ? <div className="auth-message info">{helperText}</div> : null}

        <div className="auth-actions">
          <button type="submit" className="auth-button auth-button-primary">
            Send Verification
          </button>
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={onBack}
          >
            Back to Login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
