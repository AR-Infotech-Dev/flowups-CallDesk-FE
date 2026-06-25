import { makeRequest } from "@/api/httpClient";
import { normalizeListResponse } from "../utils/amcReimders.utils";
import { CUSTOMER_FALLBACK_ENDPOINT, LIST_ENDPOINT, SEND_ENDPOINT, CALL_ENDPOINT, VISIT_ENDPOINT, ACTIVITY_ENDPOINT } from "./amcReminder.constants";


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
export async function getAmcReminders(payload = {}) {
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

export function getDefaultAmcCallDescription(customer = {}) {
  return `AMC call registered for ${customer?.name || "customer"}.`;
}

export async function makeAmcCallTicket({ customer, remarks = "" }) {
  const customerId = customer?.customer_id || customer?.id || customer?.client_id;
  const today = new Date().toISOString().split("T")[0];
  const authId = typeof window !== "undefined"
    ? window.localStorage.getItem("_auth_id") || window.localStorage.getItem("auth_id")
    : null;
  const description = String(remarks || "").trim() || getDefaultAmcCallDescription(customer);

  return makeRequest(CALL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customerId,
      client_id: customerId,
      contact_person: customer?.contact_person || customer?.name || "",
      contact_no: customer?.mobile_no || customer?.contact_no || customer?.mobile || "",
      description,
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
  const authId = typeof window !== "undefined"
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
