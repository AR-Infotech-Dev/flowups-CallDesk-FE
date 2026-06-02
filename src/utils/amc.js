export function parseDateOnly(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

export function isAmcActive(record = {}) {
  if (Object.prototype.hasOwnProperty.call(record, "active_amc")) {
    return String(record?.active_amc || "").toLowerCase() === "y";
  }

  const isAmc = String(record?.client_is_amc ?? record?.is_amc ?? "").toLowerCase() === "yes";
  if (!isAmc) return false;

  const endDate = parseDateOnly(record?.client_amc_end_date ?? record?.amc_end_date);
  if (!endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate >= today;
}
