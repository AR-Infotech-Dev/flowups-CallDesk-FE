import { KeyRound } from "lucide-react";
import { PasswordField } from "./ProfileFields";

export function ProfilePasswordPanel({
  passwordForm,
  visiblePasswords,
  changingPassword,
  onPasswordChange,
  onTogglePasswordVisibility,
  onChangePassword,
}) {
  return (
    <div className="profile-form-panel profile-password-panel">
      <div className="profile-password-heading">
        <span>
          <KeyRound size={16} />
        </span>
        <div>
          <h3>Change Password</h3>
          <p>Update your login password from your profile.</p>
        </div>
      </div>

      <div className="profile-password-grid">
        <PasswordField
          label="Current Password"
          value={passwordForm.currentPassword}
          placeholder="Enter current password"
          visible={visiblePasswords.currentPassword}
          disabled={changingPassword}
          onToggle={() => onTogglePasswordVisibility("currentPassword")}
          onChange={(event) => onPasswordChange("currentPassword", event.target.value)}
        />
        <PasswordField
          label="New Password"
          value={passwordForm.newPassword}
          placeholder="Enter new password"
          visible={visiblePasswords.newPassword}
          disabled={changingPassword}
          onToggle={() => onTogglePasswordVisibility("newPassword")}
          onChange={(event) => onPasswordChange("newPassword", event.target.value)}
        />
        <PasswordField
          label="Confirm Password"
          value={passwordForm.confirmPassword}
          placeholder="Re-enter new password"
          visible={visiblePasswords.confirmPassword}
          disabled={changingPassword}
          onToggle={() => onTogglePasswordVisibility("confirmPassword")}
          onChange={(event) => onPasswordChange("confirmPassword", event.target.value)}
        />
      </div>

      <div className="profile-password-actions">
        <button
          type="button"
          className="profile-save-button"
          onClick={onChangePassword}
          disabled={changingPassword}
        >
          <KeyRound size={15} />
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
