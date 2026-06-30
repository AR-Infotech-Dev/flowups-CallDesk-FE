export const editableProfileFields = new Set(["email", "whatsappNo", "address", "userName"]);

export const getInitials = (name = "") =>
  String(name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

export const getValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";

export const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().split("T")[0];
};

export const normalizeProfile = (user = {}) => ({
  adminID: user.adminID || "",
  name: getValue(user.name),
  email: getValue(user.email),
  dateOfBirth: toDateInput(user.dateOfBirth),
  userName: getValue(user.userName, user.user_name),
  whatsappNo: getValue(user.whatsappNo, user.whatsapp_no, user.wa_no),
  time_zone: getValue(user.time_zone, "Asia/Kolkata"),
  roleID: getValue(user.roleID, user.role_id),
  roleName: getValue(user.roleName, user.role_name, user.role, user.role_slug),
  company_id: getValue(user.company_id, user.default_company),
  company_name: getValue(user.company_name, user.companyName, user.company),
  is_approver: getValue(user.is_approver, "no"),
  google_location: getValue(user.google_location),
  status: getValue(user.status, "active"),
  address: getValue(user.address),
  contactNo: getValue(user.contactNo, user.contact_no, user.mobile_no),
});

export const buildChangedProfilePayload = (profile = {}) => ({
  email: profile.email,
  whatsappNo: profile.whatsappNo,
  address: profile.address,
  userName: profile.userName,
});

export const buildUpdatedSessionUser = ({ currentUser = {}, responseData = {}, changedPayload = {} }) => ({
  ...currentUser,
  ...responseData,
  email: changedPayload.email,
  whatsappNo: changedPayload.whatsappNo,
  address: changedPayload.address,
  userName: changedPayload.userName,
});
