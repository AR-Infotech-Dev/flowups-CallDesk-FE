
export const LIST_ENDPOINT = "/amc-reminders";
export const SEND_ENDPOINT = "/amc-reminders/send";
export const CALL_ENDPOINT = "/amc-reminders/call";
export const VISIT_ENDPOINT = "/amc-reminders/visit";
export const ACTIVITY_ENDPOINT = "/amc-reminders/activity";
export const CUSTOMER_FALLBACK_ENDPOINT = "/customers";

export const AMC_REMINDER_FILTER_FIELDS = [
  { label: "Customer", value: "name", type: "text" },
  { label: "Email", value: "email", type: "text" },
  { label: "Mobile No", value: "mobile_no", type: "text" },
  { label: "Company", value: "company_name", type: "text" },
  { label: "AMC Expiry", value: "amc_end_date", type: "date" },
  { label: "Expected Calls", value: "expected_call_count", type: "number" },
  { label: "Done Calls", value: "done_amc_call_count", type: "number" },
  { label: "Remaining Calls", value: "remaining_call_count", type: "number" },
  { label: "AMC Tickets", value: "amc_ticket_count", type: "number" },
  { label: "Visits", value: "amc_visit_scheduled_count", type: "number" },
  { label: "Visited", value: "amc_visited_count", type: "number" },
];
