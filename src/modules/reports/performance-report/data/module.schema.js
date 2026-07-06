export const performanceReportSchema = {
  title: "Performance Reports",
  description: "User-wise ticket performance, closure trends, productivity score, and activity reports.",
  menu_id: null,
  primaryKey: "ticket_id",
  api: {
    report: "/reports/user-performance",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "performance_reports",
  },
  defaultColumns: [
    "ticket_no",
    "customer_name",
    "ticket_priority",
    "ticket_status",
    "assigned_date",
    "due_date",
    "resolution_time",
  ],
  form: {
    sections: [
      {
        fields: [
          { name: "user_id", label: "User" },
          { name: "from_date", label: "From Date" },
          { name: "to_date", label: "To Date" },
          { name: "company_id", label: "Company" },
          { name: "ticket_status", label: "Ticket Status" },
        ],
      },
    ],
  },
};

