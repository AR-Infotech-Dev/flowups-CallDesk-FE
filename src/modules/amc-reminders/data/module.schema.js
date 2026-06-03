import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

export const amcReminderModuleSchema = {
  title: "AMC Reminders",
  description: "Track AMC customers by nearest expiry and send renewal reminders with optional support reports.",
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
    "support_call_count",
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
    { support_call_count: "Support Calls" },
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
        width: 160,
        minWidth: 150,
        resizable: false,
        isAlwaysVisible: true,
        cellType: "action",
      };
    }

    if (column.key === "email") return { ...column, width: 220, minWidth: 180 };
    if (column.key === "name") return { ...column, width: 220, minWidth: 180 };
    if (column.key.includes("date") || column.key.includes("_at")) return { ...column, width: 150, minWidth: 130 };
    if (column.key === "days_until_expiry" || column.key === "support_call_count") return { ...column, width: 120, minWidth: 110 };

    return column;
  }),
];
