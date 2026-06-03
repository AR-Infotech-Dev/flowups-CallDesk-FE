import { makeRequest } from "./httpClient";

const LIST_ENDPOINT = "/amc-reminders";
const SEND_ENDPOINT = "/amc-reminders/send";
const CUSTOMER_FALLBACK_ENDPOINT = "/customers";

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
    support_call_count:
      customer.support_call_count ??
      customer.support_calls ??
      customer.ticket_count ??
      customer.amc_support_count ??
      0,
    last_reminder_sent_at:
      customer.last_reminder_sent_at ||
      customer.amc_last_reminder_sent_at ||
      null,
    reminder_count:
      customer.reminder_count ??
      customer.amc_reminder_count ??
      0,
    last_reminder_include_report:
      customer.last_reminder_include_report ??
      customer.amc_last_reminder_include_report ??
      false,
  };
}

function sortByAmcEndDate(customers = []) {
  return [...customers].sort((left, right) => {
    const leftDate = parseDate(left.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseDate(right.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });
}

function normalizeListResponse(response = {}) {
  const rows = Array.isArray(response.data) ? response.data : [];
  const normalizedRows = rows
    .filter(isAmcCustomer)
    .map(normalizeAmcCustomer);

  return {
    ...response,
    data: sortByAmcEndDate(normalizedRows),
  };
}

async function fetchCustomerFallback(payload) {
  const response = await makeRequest(CUSTOMER_FALLBACK_ENDPOINT, {
    method: "POST",
    body: {
      ...payload,
      filters: [
        ...(payload.filters || []),
        { field: "is_amc", operator: "equals", value: "yes" },
      ],
      order_by: payload.order_by || "amc_end_date",
      order: payload.order || "ASC",
    },
  });

  return normalizeListResponse(response);
}

export async function fetchAmcReminderCustomers(payload = {}) {
  const response = await makeRequest(LIST_ENDPOINT, {
    method: "POST",
    body: {
      ...payload,
      order_by: payload.order_by || "amc_end_date",
      order: payload.order || "ASC",
    },
  });

  if (response?.success) {
    return normalizeListResponse(response);
  }

  if (response?.status === 404 || response?.status === 405) {
    return fetchCustomerFallback(payload);
  }

  return response;
}

export async function sendAmcReminder({ customerId, includeReport = false }) {
  return makeRequest(SEND_ENDPOINT, {
    method: "POST",
    body: {
      customer_id: customerId,
      include_report: includeReport,
    },
  });
}

export const amcReminderApiContract = {
  list: {
    method: "POST",
    path: LIST_ENDPOINT,
    note: "Return only AMC=yes customers, sorted by amc_end_date ASC. Include support_call_count for the AMC period and reminder tracking fields.",
  },
  send: {
    method: "POST",
    path: SEND_ENDPOINT,
    note: "Send reminder email. When include_report=true, attach an Excel report of support calls in the customer's AMC period and persist reminder tracking.",
  },
};
