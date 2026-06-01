import AuthShell from "./AuthShell";

function VerificationPage({
  formData,
  error,
  helperText,
  onChange,
  onSubmit,
  onBack,
}) {
  return (
    <AuthShell
      title="Verification"
      subtitle="Enter the verification code and set a new password to finish recovery."
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

        <label className="auth-field">
          <span className="auth-label">Verification Code</span>
          <input
            className="auth-input"
            type="text"
            name="code"
            value={formData.code}
            onChange={onChange}
            placeholder="Enter code"
            autoComplete="off"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">New Password</span>
          <input
            className="auth-input"
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Enter new password"
            autoComplete="off"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Confirm Password</span>
          <input
            className="auth-input"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={onChange}
            placeholder="Re-enter new password"
            autoComplete="off"
          />
        </label>

        {error ? <div className="auth-message error">{error}</div> : null}
        {helperText ? <div className="auth-message info">{helperText}</div> : null}

        <div className="auth-actions">
          <button type="submit" className="auth-button auth-button-primary">
            Verify and Reset
          </button>
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export default VerificationPage;
