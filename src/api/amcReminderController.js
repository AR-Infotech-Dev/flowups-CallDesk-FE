import { makeRequest } from "./httpClient";

const LIST_ENDPOINT = "/amc-reminders";
const SEND_ENDPOINT = "/amc-reminders/send";
const CALL_ENDPOINT = "/amc-reminders/call";
const VISIT_ENDPOINT = "/amc-reminders/visit";
const ACTIVITY_ENDPOINT = "/amc-reminders/activity";
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
    support_call_count:
      customer.support_call_count ??
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

function sortCustomers(customers = [], orderBy = "remaining_call_count", order = "DESC") {
  const direction = String(order || "DESC").toUpperCase() === "ASC" ? 1 : -1;

  return [...customers].sort((left, right) => {
    if (
      orderBy === "remaining_call_count" ||
      orderBy === "done_amc_call_count" ||
      orderBy === "expected_call_count" ||
      orderBy === "exp_call_count" ||
      orderBy === "amc_ticket_count" ||
      orderBy === "amc_visit_scheduled_count" ||
      orderBy === "amc_visited_count"
    ) {
      return (Number(left[orderBy] || 0) - Number(right[orderBy] || 0)) * direction;
    }

    const leftDate = parseDate(left.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseDate(right.amc_end_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return (leftDate - rightDate) * direction;
  });
}

function normalizeListResponse(response = {}, sort = {}) {
  const rows = Array.isArray(response.data) ? response.data : [];
  const normalizedRows = rows
    .filter(isAmcCustomer)
    .map(normalizeAmcCustomer);

  return {
    ...response,
    data: sortCustomers(normalizedRows, sort.order_by, sort.order),
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
      order_by: payload.order_by || "remaining_call_count",
      order: payload.order || "DESC",
    },
  });

  return normalizeListResponse(response, {
    order_by: payload.order_by || "remaining_call_count",
    order: payload.order || "DESC",
  });
}

export async function fetchAmcReminderCustomers(payload = {}) {
  const response = await makeRequest(LIST_ENDPOINT, {
    method: "POST",
    body: {
      ...payload,
      order_by: payload.order_by || "remaining_call_count",
      order: payload.order || "DESC",
    },
  });

  if (response?.success) {
    return normalizeListResponse(response, {
      order_by: payload.order_by || "remaining_call_count",
      order: payload.order || "DESC",
    });
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

export async function makeAmcCallTicket({ customer, remarks = "" }) {
  const customerId = customer?.customer_id || customer?.id || customer?.client_id;
  const today = new Date().toISOString().split("T")[0];
  const authId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("_auth_id") || window.localStorage.getItem("auth_id")
      : null;

  return makeRequest(CALL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customerId,
      client_id: customerId,
      contact_person: customer?.contact_person || customer?.name || "",
      contact_no: customer?.mobile_no || customer?.contact_no || customer?.mobile || "",
      description: remarks || `AMC call created for ${customer?.name || "customer"}.`,
      title: `AMC Call - ${customer?.name || customerId}`,
      query_type: customer?.amc_query_type || customer?.query_type || null,
      ticket_status: customer?.amc_ticket_status || customer?.ticket_status || "205",
      ticket_priority: customer?.amc_ticket_priority || customer?.ticket_priority || null,
      assignee: customer?.responsible_person || customer?.assigned_to || authId || null,
      start_date: today,
      due_date: today,
      status: "active",
      active_amc: "y",
      amc_call: "y",
      source: "AMC",
      call_direction: "out",
      created_by: authId,
    }),
  });
}

export async function scheduleAmcVisit({ customer, visitScheduledAt, visitDetails = "" }) {
  const customerId = customer?.customer_id || customer?.id || customer?.client_id;
  const today = new Date().toISOString().split("T")[0];
  const authId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("_auth_id") || window.localStorage.getItem("auth_id")
      : null;

  return makeRequest(VISIT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customerId,
      client_id: customerId,
      contact_person: customer?.contact_person || customer?.name || "",
      contact_no: customer?.mobile_no || customer?.contact_no || customer?.mobile || "",
      description: visitDetails || `AMC visit scheduled for ${customer?.name || "customer"}.`,
      visit_details: visitDetails,
      visit_scheduled_at: visitScheduledAt,
      query_type: customer?.amc_visit_query_type || customer?.amc_query_type || customer?.query_type || null,
      ticket_status: customer?.amc_ticket_status || customer?.ticket_status || "205",
      ticket_priority: customer?.amc_ticket_priority || customer?.ticket_priority || null,
      assignee: customer?.responsible_person || customer?.assigned_to || authId || null,
      employee_id: customer?.responsible_person || customer?.assigned_to || authId || null,
      start_date: today,
      due_date: today,
      status: "active",
      created_by: authId,
    }),
  });
}
export async function markVisited({ visit }) {
  return await makeRequest("tickets/visits/visited", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticket_id: visit.ticket_id,
      visit_id: visit.visit_id,
      visit_details: visit.visit_details || "",
    }),
  });
}

export async function fetchAmcActivity({ customerId }) {
  const response = await makeRequest(ACTIVITY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id: customerId }),
  });

  if (!response?.success) return response;

  const activityData = response.data || {
    customer: response.customer || null,
    calls: response.calls || [],
    visits: response.visits || [],
    tickets: response.tickets || [],
    reminders: response.reminders || [],
    counts: response.counts || {},
  };

  return {
    ...response,
    data: {
      customer: activityData.customer || null,
      calls: activityData.calls || [],
      visits: activityData.visits || [],
      tickets: activityData.tickets || [],
      reminders: activityData.reminders || [],
      counts: activityData.counts || {},
    },
  };
}

export const amcReminderApiContract = {
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
