import { LIST_ENDPOINT, SEND_ENDPOINT, CALL_ENDPOINT, VISIT_ENDPOINT } from "../data/amcReminder.constants";

function toLower(value) {
  return String(value || "").trim().toLowerCase();
}
function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}
function getAmcEndDate(customer = {}) {
  return (
    customer.amc_end_date ||
    customer.client_amc_end_date ||
    customer.amcEndDate ||
    null
  );
}
function isAmcCustomer(customer = {}) {
  return (
    toLower(customer.is_amc) === "yes" ||
    toLower(customer.client_is_amc) === "yes" ||
    toLower(customer.active_amc) === "y"
  );
}
function daysUntil(dateValue) {
  const endDate = parseDate(dateValue);
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
function normalizeAmcCustomer(customer = {}) {
  const amcEndDate = getAmcEndDate(customer);
  const expectedCallCount = Number(
    customer.expected_call_count ??
    customer.monthly_expected_calls ??
    customer.exp_call_count ??
    0
  );
  const doneAmcCallCount = Number(
    customer.done_amc_call_count ??
    customer.done_call_count ??
    customer.amc_done_call_count ??
    customer.monthly_done_calls ??
    customer.amc_call_count ??
    customer.current_month_amc_calls ??
    customer.current_month_amc_call_count ??
    0
  );

  return {
    ...customer,
    customer_id: customer.customer_id || customer.id || customer.client_id,
    name: customer.name || customer.customer_name || customer.client_name || "",
    email: customer.email || customer.customer_email || "",
    mobile_no: customer.mobile_no || customer.contact_no || customer.mobile || "",
    contact_person: customer.contact_person || customer.contactPerson || "",
    company_name: customer.company_name || customer.companyName || "",
    is_amc: customer.is_amc || customer.client_is_amc || "yes",
    amc_start_date: customer.amc_start_date || customer.client_amc_start_date || null,
    amc_end_date: amcEndDate,
    days_until_expiry: customer.days_until_expiry ?? daysUntil(amcEndDate),
    support_call_count: customer.support_call_count ??
      customer.support_calls ??
      customer.ticket_count ??
      customer.amc_support_count ??
      0,
    exp_call_count: expectedCallCount,
    expected_call_count: expectedCallCount,
    done_amc_call_count: doneAmcCallCount,
    remaining_call_count: Math.max(expectedCallCount - doneAmcCallCount, 0),
    amc_ticket_count: Number(customer.amc_ticket_count ?? 0),
    amc_visit_scheduled_count: Number(customer.amc_visit_scheduled_count ?? 0),
    amc_visited_count: Number(customer.amc_visited_count ?? 0),
    last_reminder_sent_at: customer.last_reminder_sent_at ||
      customer.amc_last_reminder_sent_at ||
      null,
    reminder_count: customer.reminder_count ??
      customer.amc_reminder_count ??
      0,
    last_reminder_include_report: customer.last_reminder_include_report ??
      customer.amc_last_reminder_include_report ??
      false,
  };
}
function sortCustomers(customers = [], orderBy = "remaining_call_count", order = "DESC") {
  const direction = String(order || "DESC").toUpperCase() === "ASC" ? 1 : -1;

  return [...customers].sort((left, right) => {
    if (orderBy === "remaining_call_count" ||
      orderBy === "done_amc_call_count" ||
      orderBy === "expected_call_count" ||
      orderBy === "exp_call_count" ||
      orderBy === "amc_ticket_count" ||
      orderBy === "amc_visit_scheduled_count" ||
      orderBy === "amc_visited_count") {
      return (Number(left[orderBy] || 0) - Number(right[orderBy] || 0)) * direction;
    }

    const leftDate = parseDate(left.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseDate(right.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return (leftDate - rightDate) * direction;
  });
}
export function normalizeListResponse(response = {}, sort = {}) {
  const rows = Array.isArray(response.data) ? response.data : [];
  const normalizedRows = rows
    .filter(isAmcCustomer)
    .map(normalizeAmcCustomer);

  return {
    ...response,
    data: sortCustomers(normalizedRows, sort.order_by, sort.order),
  };
}export const amcReminderApiContract = {
  list: {
    method: "POST",
    path: LIST_ENDPOINT,
    note: "Return only AMC=yes customers, sorted by remaining_call_count DESC by default. exp_call_count is the fixed monthly target. done_amc_call_count should be the current-month count of tickets where amc_call='y'. remaining_call_count is derived as exp_call_count - done_amc_call_count.",
  },
  send: {
    method: "POST",
    path: SEND_ENDPOINT,
    note: "Send reminder email. When include_report=true, attach an Excel report of support calls in the customer's AMC period and persist reminder tracking.",
  },
  makeCall: {
    method: "POST",
    path: CALL_ENDPOINT,
    note: "Create an AMC call for the selected customer. Backend should create a ticket/call record with amc_call='y'. This is separate from reminder send tracking.",
  },
  visit: {
    method: "POST",
    path: VISIT_ENDPOINT,
    note: "Create an AMC visit by creating an AMC-related ticket with amc_call='n', then scheduling a ticket_visits row.",
  },
};
export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAmcReminderRowIdentifier(row, index) {
  return row?.customer_id || row?.id || row?.client_id || `amc-reminder-${index}`;
}

export function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getDaysLeftClassName(value) {
  const days = Number(value);

  if (days < 0) return "amc-expiry-chip expired";
  if (days <= 15) return "amc-expiry-chip urgent";
  if (days <= 30) return "amc-expiry-chip warning";
  return "amc-expiry-chip";
}

function isPastScheduledTime(value = "") {
  if (!value) return false;
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return false;
  return new Date() >= date;
}
export function toLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}
export function toMysqlDateTime(value = "") {
  if (!value) return "";
  return `${value.replace("T", " ")}:00`;
}

