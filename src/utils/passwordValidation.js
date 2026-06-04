export function validatePasswordUpdate({
  currentPassword,
  newPassword,
  confirmPassword,
  requireCurrentPassword = false,
}) {
  if (requireCurrentPassword && !currentPassword) {
    return "Please enter current password.";
  }

  if (!newPassword || !confirmPassword) {
    return "Please fill all password fields.";
  }

  if (newPassword.length < 6) {
    return "New password must be at least 6 characters.";
  }

  if (requireCurrentPassword && currentPassword === newPassword) {
    return "New password must be different from current password.";
  }

  if (newPassword !== confirmPassword) {
    return "New password and confirm password must match.";
  }

  return "";
}
