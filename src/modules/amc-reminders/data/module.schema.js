import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

export const amcReminderModuleSchema = {
  title: "AMC Management",
  description: "Manage AMC customers, reminders, monthly expected calls, and AMC call activity.",
  menu_id: null,
  primaryKey: "customer_id",
  api: {
    list: "/amc-reminders",
    send: "/amc-reminders/send",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "amc_reminders",
  },
  tableCellConfig: [
    { column_name: "name", type: "person" },
    { column_name: "email", type: "clip" },
    { column_name: "company_name", type: "tag" },
    { column_name: "is_amc", type: "badge" },
  ],
  defaultColumns: [
    "name",
    "email",
    "mobile_no",
    "company_name",
    "amc_start_date",
    "amc_end_date",
    "days_until_expiry",
    "expected_call_count",
    "done_amc_call_count",
    "remaining_call_count",
    "amc_ticket_count",
    "amc_visit_scheduled_count",
    "amc_visited_count",
    "last_reminder_sent_at",
    "reminder_count",
    "actions",
  ],
  skipFields: [],
  columnMappings: [
    { name: "Customer" },
    { mobile_no: "Mobile No" },
    { company_name: "Company" },
    { amc_start_date: "AMC Start" },
    { amc_end_date: "AMC Expiry" },
    { days_until_expiry: "Days Left" },
    { expected_call_count: "Expected / Month" },
    { done_amc_call_count: "Done This Month" },
    { remaining_call_count: "Remaining" },
    { amc_ticket_count: "AMC Tickets" },
    { amc_visit_scheduled_count: "Visits" },
    { amc_visited_count: "Visited" },
    { last_reminder_sent_at: "Last Reminder" },
    { reminder_count: "Reminders" },
    { actions: "Action" },
  ],
  savedFilters: [],
};

export const amcReminderFallbackColumns = [
  ...buildFallbackColumnsFromKeys(amcReminderModuleSchema.defaultColumns, {
    columnMappings: amcReminderModuleSchema.columnMappings,
    tableCellConfig: amcReminderModuleSchema.tableCellConfig,
  }).map((column) => {
    if (column.key === "actions") {
      return {
        ...column,
        width: 360,
        minWidth: 340,
        resizable: false,
        isAlwaysVisible: true,
        cellType: "action",
      };
    }

    if (column.key === "email") return { ...column, width: 220, minWidth: 180 };
    if (column.key === "name") return { ...column, width: 220, minWidth: 180 };
    if (column.key.includes("date") || column.key.includes("_at")) return { ...column, width: 150, minWidth: 130 };
    if (
      column.key === "days_until_expiry" ||
      column.key === "expected_call_count" ||
      column.key === "done_amc_call_count" ||
      column.key === "remaining_call_count" ||
      column.key === "amc_ticket_count" ||
      column.key === "amc_visit_scheduled_count" ||
      column.key === "amc_visited_count"
    ) return { ...column, width: 120, minWidth: 110 };

    return column;
  }),
];
