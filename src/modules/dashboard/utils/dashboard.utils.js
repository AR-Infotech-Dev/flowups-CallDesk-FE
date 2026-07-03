export function getRoleLabel(roleSlug) {
  if (roleSlug === "super_admin") return "Super Admin";
  if (roleSlug === "admin") return "Admin";
  return "User";
}
export function isAdminRole(roleSlug) {
  return roleSlug === "super_admin" || roleSlug === "admin";
}
function getInitials(name = "User") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export const parseCustomerProducts = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const productMatchesAlert = (product = {}, alert = {}) => {
  const sameSerial = product.serial_number && alert.serial_number && String(product.serial_number) === String(alert.serial_number);
  const sameProductName = product.product_name && alert.product_name && String(product.product_name) === String(alert.product_name);
  const sameExpiry = product.expiry_date && alert.expiry_date && String(product.expiry_date).slice(0, 10) === String(alert.expiry_date).slice(0, 10);

  return sameSerial || (sameProductName && sameExpiry);
};
const getTodayDateInputValue = () => {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

export const getDateInputMinValue = (currentExpiry = "") => {
  const todayValue = getTodayDateInputValue();
  if (!currentExpiry) return todayValue;

  const currentExpiryValue = String(currentExpiry).slice(0, 10);
  const currentExpiryDate = new Date(`${currentExpiryValue}T00:00:00`);
  const todayDate = new Date(`${todayValue}T00:00:00`);

  if (Number.isNaN(currentExpiryDate.getTime()) || currentExpiryDate < todayDate) {
    return todayValue;
  }

  return currentExpiryValue;
};
export const getRedirectFilters = ({label = '' , redirectTo = ''})=>{
  
}
