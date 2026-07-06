export const toReportDateInput = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export const formatReportDate = (value, options = {}) => {
  if (!value) return "-";

  const dateValue = options.dateOnly
    ? `${String(value).slice(0, 10)}T00:00:00`
    : value;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(value);

  const { dateOnly: _dateOnly, ...formatOptions } = options;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...formatOptions,
  });
};

export const formatReportDateTime = (value, options = {}) => {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

export const formatReportTime = (value, options = {}) => {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
};

export const formatReportDuration = (value) => {
  const totalSeconds = Math.max(Number(value) || 0, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

export const formatReportMinutesSeconds = (minutes, seconds) => {
  const totalSeconds = Number.isFinite(Number(seconds))
    ? Math.max(0, Math.round(Number(seconds)))
    : Math.max(0, Math.round(Number(minutes || 0) * 60));
  return `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} sec`;
};

export const toReportArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.list)) return value.list;
  return [];
};

export const pickReportValue = (item = {}, keys = []) => {
  const matchedKey = keys.find((key) => item[key] !== undefined && item[key] !== null);
  return matchedKey ? item[matchedKey] : "";
};

export const normalizeReportOption = (item = {}, valueKeys = [], labelKeys = []) => ({
  value: String(pickReportValue(item, valueKeys) || ""),
  label: String(pickReportValue(item, labelKeys) || "Unnamed"),
});

export const stripReportHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
