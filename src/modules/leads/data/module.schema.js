import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "@utils/moduleStructure";

const FIXED_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

export const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow Up" },
  { value: "interested", label: "Interested" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "converted", label: "Converted" },
];

export const leadSourceOptions = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk In" },
  { value: "other", label: "Other" },
];

const visibleField = { alwaysVisible: true, alwaysEditable: true };

export const leadsModuleSchema = {
  title: "Leads",
  description: "Manage sales enquiries, follow-ups, and customer conversion.",
  menu_id: null,
  primaryKey: "lead_id",
  api: {
    list: "/leads",
    delete: "/leads/delete",
    create: "/leads/create",
    edit: "/leads",
  },
  defaultColumns: ["name", "mobile_no", "customer_name", "lead_source", "lead_status", "next_followup_date", "assigned_to_name"],
  skipFields: ["company_id", "created_by", "modified_by"],
  columnMappings: [
    { name: "Lead Name" },
    { customer_name: "Linked Customer" },
    { lead_source: "Source" },
    { lead_status: "Lead Status" },
    { next_followup_date: "Next Follow-up" },
    { assigned_to_name: "Assigned To" },
  ],
  tableCellConfig: [
    { column_name: "name", type: "person" },
    { column_name: "lead_source", type: "badge" },
    { column_name: "lead_status", type: "status" },
    { column_name: "next_followup_date", type: "date" },
    { column_name: "status", type: "badge" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      lead_id: null,
      customer_id: "",
      name: "",
      company_name: "",
      gst_number: "",
      contact_person: "",
      mobile_no: "",
      email: "",
      requirement: "",
      lead_source: "call",
      lead_status: "new",
      assigned_to: "",
      next_followup_date: "",
      lost_reason: "",
      status: "active",
    },
    sections: [

      {
        title: "Lead Details",
        columns: 2,
        fields: [
          { ...visibleField, name: "name", label: "Lead Name", type: "text", required: true, gridSpan: 3 },
          { ...visibleField, name: "mobile_no", label: "Mobile Number", type: "text", required: true, gridSpan: 3 },
          { ...visibleField, name: "company_name", label: "Company Name", type: "text", gridSpan: 3 },
          { ...visibleField, name: "gst_number", label: "GST Number", type: "text", gridSpan: 3, placeholder: "Enter GST number" },
        ],
      },
      {
        columns: 2,
        fields: [

          { ...visibleField, name: "contact_person", label: "Contact Person", type: "text", gridSpan: 3 },
          { ...visibleField, name: "email", label: "Email", type: "email", gridSpan: 3 },
          { ...visibleField, name: "lead_source", label: "Lead Source", type: "select", options: leadSourceOptions, gridSpan: 3 },
          { ...visibleField, name: "lead_status", label: "Lead Status", type: "select", options: leadStatusOptions, gridSpan: 3 },
        ],
      },
      {
        columns: 2,
        fields: [
          { ...visibleField, name: "requirement", label: "Requirement", type: "textarea", rows: 3, gridSpan: 12 },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            ...visibleField,
            name: "lost_reason",
            label: "Lost Reason",
            type: "textarea",
            rows: 2,
            gridSpan: 12,
            visibleWhen: (values) => values.lead_status === "lost",
          },

        ],
      },
      {
        columns: 2,
        fields: [
          { ...visibleField, name: "next_followup_date", label: "Next Follow-up", type: "datetime-local", gridSpan: 4 },
          {
            ...visibleField,
            name: "status",
            label: "Status",
            type: "radio",
            gridSpan: 4,
            options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }],
          },
        ],
      },
    ],
  },
  validationSchema: z.object({
    lead_id: z.union([z.string(), z.number(), z.null()]).optional(),
    name: z.string().trim().min(1, "Lead name is required"),
    mobile_no: z.string().trim().min(7, "Valid mobile number is required"),
    company_name: z.string().nullish(),
    gst_number: z.union([
      z.literal(""),
    ]).nullish(),
    contact_person: z.string().nullish(),
    email: z.union([z.literal(""), z.string().email("Enter a valid email")]).nullish(),
    requirement: z.string().nullish(),
    lead_source: z.enum(leadSourceOptions.map((item) => item.value)),
    lead_status: z.enum(leadStatusOptions.map((item) => item.value)),
    assigned_to: z.union([z.string(), z.number(), z.null()]).optional(),
    next_followup_date: z.string().nullish(),
    lost_reason: z.string().nullish(),
    status: z.enum(["active", "inactive"]),
  }).superRefine((data, ctx) => {
    if (data.lead_status === "lost" && !String(data.lost_reason || "").trim()) {
      ctx.addIssue({ code: "custom", path: ["lost_reason"], message: "Lost reason is required" });
    }
  }),
};

export const leadsFallbackColumns = [
  ...FIXED_COLUMNS,
  ...buildFallbackColumnsFromKeys(leadsModuleSchema.defaultColumns, {
    columnMappings: leadsModuleSchema.columnMappings,
    tableCellConfig: leadsModuleSchema.tableCellConfig,
  }),
];
