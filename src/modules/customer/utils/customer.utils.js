import { customerModuleSchema } from "../data/module.schema";

export function getCustomerIdentifier(customer = {}) {
  return customer?.customer_id;
}

export function normalizeCustomerData(customer = {}) {
  return {
    ...customerModuleSchema.form.initialValues,
    ...customer,
    name: customer?.name || null,
    email: customer?.email || null,
    mobile_no: customer?.mobile_no || null,
    wa_no: customer?.wa_no || null,
    birth_date: customer?.birth_date ? new Date(customer.birth_date).toISOString().split("T")[0] : null,
    address: customer?.address || null,
    pan_number: customer?.pan_number || null,
    company_name: customer?.company_name || null,
    billing_name: customer?.billing_name || null,
    billing_address: customer?.billing_address || null,
    company_id: customer?.company_id || null,
    mailing_address: customer?.mailing_address || null,
    is_amc: String(customer?.is_amc || "no").toLowerCase(),
    amc_term_period: customer?.amc_term_period || null,
    amc_start_date: customer?.amc_start_date ? new Date(customer.amc_start_date).toISOString().split("T")[0] : null,
    amc_end_date: customer?.amc_end_date ? new Date(customer.amc_end_date).toISOString().split("T")[0] : null,
  };
}

export const normalizeAddOns = (value = [], { keepEmpty = false } = {}) => {
  const finalize = (items) => keepEmpty ? items : items.filter(Boolean);

  if (Array.isArray(value)) {
    return finalize(value.map((item) => {
      if (typeof item === "object" && item !== null) {
        return String(item.name || item.add_on_name || item.label || "").trim();
      }

      return String(item || "").trim();
    }));
  }

  if (value === undefined || value === null) return [];

  return finalize(String(value).split(",").map((item) => item.trim()));
};

const formatDateInputParts = (year, month, day) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  if (
    !Number.isInteger(numericYear) ||
    date.getUTCFullYear() !== numericYear ||
    date.getUTCMonth() + 1 !== numericMonth ||
    date.getUTCDate() !== numericDay
  ) {
    return "";
  }

  return `${String(numericYear).padStart(4, "0")}-${String(numericMonth).padStart(2, "0")}-${String(numericDay).padStart(2, "0")}`;
};

export const toSafeDateInputValue = (value) => {
  if (value === undefined || value === null || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateInputParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const text = String(value).trim();
  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return formatDateInputParts(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const dayFirstMatch = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (dayFirstMatch) {
    const rawYear = Number(dayFirstMatch[3]);
    const year = rawYear < 100 ? (rawYear >= 70 ? 1900 + rawYear : 2000 + rawYear) : rawYear;
    const dayFirstValue = formatDateInputParts(year, dayFirstMatch[2], dayFirstMatch[1]);
    if (dayFirstValue) return dayFirstValue;
  }

  const excelSerial = Number(text);
  if (Number.isInteger(excelSerial) && excelSerial > 0 && excelSerial < 100000) {
    const serialDate = new Date(Date.UTC(1899, 11, 30) + excelSerial * 86400000);
    return formatDateInputParts(
      serialDate.getUTCFullYear(),
      serialDate.getUTCMonth() + 1,
      serialDate.getUTCDate()
    );
  }

  const parsedDate = new Date(text);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return formatDateInputParts(
    parsedDate.getFullYear(),
    parsedDate.getMonth() + 1,
    parsedDate.getDate()
  );
};

export const calculateAmcEndDate = (startDate, termPeriod) => {
  const normalizedStartDate = toSafeDateInputValue(startDate);
  const months = {
    "3_month": 3,
    "6_month": 6,
    yearly: 12,
  }[termPeriod];

  if (!normalizedStartDate || !months) return "";

  const [year, month, day] = normalizedStartDate.split("-").map(Number);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  // Keep month-end subscriptions on the final valid day of the target month.
  if (day > lastDayOfTargetMonth) {
    return formatDateInputParts(targetYear, targetMonth + 1, lastDayOfTargetMonth);
  }

  const endDate = new Date(Date.UTC(targetYear, targetMonth, day));
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  return formatDateInputParts(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() + 1,
    endDate.getUTCDate()
  );
};

export const normalizeCustomerProducts = (customer = {}) => {
  const rows = customer?.customer_products || customer?.products || [];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      product_id: row?.product_id || "",
      product_name: row?.product_name || "",
      serial_number: row?.serial_number || "",
      expiry_date: toSafeDateInputValue(row?.expiry_date),
      add_ons: normalizeAddOns(row?.add_ons || row?.addons || row?.addOns),
    }))
    .filter((row) => row.product_id || row.product_name || row.serial_number || row.expiry_date || row.add_ons.length);
};

export const normalizeCustomerContacts = (customer = {}) => {
  const rows =
    customer?.customer_contacts ||
    customer?.contact_persons ||
    customer?.contacts ||
    [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => ({
      contact_id: row?.contact_id || null,
      customer_id: row?.customer_id || customer?.customer_id || null,
      name: row?.name || row?.contact_person || "",
      designation: row?.designation || "",
      mobile_no: row?.mobile_no || row?.contact_no || "",
      email: row?.email || "",
      department: row?.department || "",
      is_primary: row?.is_primary === "y" || row?.is_primary === true ? "y" : "n",
    }))
    .filter((row) =>
      row.name ||
      row.designation ||
      row.mobile_no ||
      row.email ||
      row.department
    );
};
