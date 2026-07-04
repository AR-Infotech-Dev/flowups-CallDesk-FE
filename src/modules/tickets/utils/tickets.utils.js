export const TICKET_VISIBILITY_META = {
  assigned: { label: "Assigned", color: "status-blue" },
  created: { label: "Created", color: "status-green" },
  delegated: { label: "Delegated", color: "status-purple" },
  reassigned: { label: "Reassigned", color: "status-amber" },
  company: { label: "Company", color: "status-gray" },
};

export const TICKET_VISIBILITY_COLUMN = {
  key: "ticket_visibility_label",
  label: "View As",
  width: 130,
  minWidth: 110,
  cellType: "badge",
  colorField: "ticket_visibility_color",
  isAlwaysVisible: false,
};

export const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const TICKET_QUICK_FILTERS = [
  { label: "Open", value: "open", filters: [{ field: "ticket_status", condition: "equal_to", value: "Open", type: "select" }] },
  { label: "In Progress", value: "in_progress", filters: [{ field: "ticket_status", condition: "equal_to", value: "In Progress", type: "select" }] },
  { label: "Pending", value: "pending", filters: [{ field: "ticket_status", condition: "equal_to", value: "Pending", type: "select" }] },
  { label: "Closed", value: "closed", filters: [{ field: "ticket_status", condition: "equal_to", value: "Closed", type: "select" }] },
  { label: "Due Today", value: "due_today", filters: [{ field: "due_date", condition: "today", value: "", type: "date" }] },
  {
    label: "Overdue",
    value: "overdue",
    getFilters: () => [
      { field: "due_date", condition: "less_than", value: toDateInputValue(), type: "date" },
      { field: "ticket_status", condition: "not_equal_to", value: "Closed", type: "select" },
    ],
  },
  { label: "This Week", value: "this_week", filters: [{ field: "due_date", condition: "this_week", value: "", type: "date" }] },
  { label: "High Priority", value: "high_priority", filters: [{ field: "ticket_priority", condition: "equal_to", value: "High", type: "select" }] },
  { label: "Visit Required", value: "visit_required", filters: [{ field: "visit_required", condition: "equal_to", value: "y", type: "select" }] },
  { label: "Unassigned", value: "unassigned", filters: [{ field: "assignee", condition: "is_empty", value: "", type: "select" }] },
];

export const getTicketIdentifier = (ticket = {}) => ticket?.ticketID ?? ticket?.ticket_id ?? ticket?.id;

export const getTicketQuickFilters = (value = "") => {
  const quickFilter = TICKET_QUICK_FILTERS.find((item) => item.value === value);
  if (!quickFilter) return [];

  return typeof quickFilter.getFilters === "function"
    ? quickFilter.getFilters()
    : quickFilter.filters || [];
};

export const normalizeTicketVisibility = (ticket = {}) => {
  const reason = String(ticket.visibility_reason || ticket.delegation_flag || "").toLowerCase();
  const meta = TICKET_VISIBILITY_META[reason] || { label: "-", color: "status-gray" };

  return {
    ...ticket,
    ticket_visibility_label: meta.label,
    ticket_visibility_color: meta.color,
  };
};

export const mergeTicketFilters = ({ filterState, quickFilter }) => [
  ...(Array.isArray(filterState.filters) ? filterState.filters : []),
  ...getTicketQuickFilters(quickFilter),
];
