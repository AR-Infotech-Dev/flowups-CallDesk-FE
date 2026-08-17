import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "@utils/moduleStructure";
import { icon } from "leaflet";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

export const quotationStatusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Revision Required", value: "revision_required" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const itemSchema = z.object({
  product_id: z.coerce.number().positive("Product is required"),
  product_name: z.string().trim().min(1, "Product is required"),
  product_description: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  discount_rate: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100"),
  gst_rate: z.coerce.number().min(0, "GST cannot be negative").max(100, "GST cannot exceed 100"),
});

export const quotationsModuleSchema = {
  title: "Quotations",
  description: "Create, send and track customer quotations from one place.",
  menu_id: null,
  primaryKey: "quotation_id",
  api: {
    list: "/quotations",
    delete: "/quotations/delete",
    create: "/quotations/create",
    edit: "/quotations",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "quotations",
  },
  staticJoined: [],
  defaultColumns: ["quotation_no", "is_revised_copy", "lead_id","customer_id", "quotation_date", "valid_until", "grand_total", "quotation_status", "created_by"],
  skipFields: [
    "company_id",
    // "customer_id",
    "contact_id",
    "ticket_id",
    "subtotal",
    "discount_total",
    "tax_total",
    "notes",
    "terms",
    "status",
    "record_status",
    "workflow_status",
    // "created_by",
    // "created_date",
    // "modified_by",
    // "modified_date",
  ],
  tableCellConfig: [
    { column_name: "quotation_no", type: "clip" },
    { column_name: "is_revised_copy", type: "revision" },
    { column_name: "customer_name", type: "person" },
    { column_name: "quotation_date", type: "date" },
    { column_name: "valid_until", type: "date" },
    { column_name: "grand_total", type: "currency" },
    { column_name: "quotation_status", type: "status" },
    { column_name: "created_by_name", type: "tag" },
  ],
  columnMappings: [
    { quotation_no: "Quotation No" },
    { is_revised_copy: "Revision" },
    { customer_id: "Customer Name" },
    { lead_id: "Lead Name" },
    // { customer_name: "Customer Name" },
    { quotation_date: "Quotation Date" },
    { valid_until: "Valid Until" },
    { grand_total: "Grand Total" },
    { quotation_status: "Quotation Status" },
    { created_by_name: "Created By" },
  ],
  filterFieldOptions: {
    quotation_status: { type: "select", options: quotationStatusOptions },
  },
  savedFilters: [],
  form: {
    initialValues: {
      quotation_id: null,
      party_id: "",
      customer_id: "",
      lead_id: "",
      contact_id: "",
      ticket_id: "",
      quotation_date: "",
      valid_until: "",
      timeframe: "",
      quotation_status: "draft",
      notes: "",
      terms: "",
      items: [],
    },
    sections: [
      {
        columns: 2,
        icon:null,
        fields: [
          {
            name: "party_id",
            label: "Customer / Lead",
            type: "smartSelectInput",
            required: true,
            id: "party_id",
            gridSpan: 3,
            readOnlyWhen: (values) => Boolean(values.ticket_id),
            config: {
              type: "customer",
              source: "customer",
              list: "customer_id,name,email",
              placeholder: "Select Customer",
              label: "Lead",
              allowAddNew: true,
              cacheCreatedOption: false,
              multi: false,
              getValue: (item) => item.customer_id,
              getLabel: (item) => item.name
            },
          },
          { name: "valid_until", label: "Valid Until", type: "date", required: true, gridSpan: 3, alwaysVisible: true, alwaysEditable: true },
          { name: "quotation_date", label: "Quotation Date", type: "date", required: true, gridSpan: 3, alwaysVisible: true, alwaysEditable: true },
          { name: "timeframe", label: "Timeframe", type: "text", gridSpan: 3, placeholder: "e.g. 14 Days", alwaysVisible: true, alwaysEditable: true },
        ],
      },
      {
        columns: 2,
        icon:null,
        fields: [
          { name: "notes", label: "Notes", type: "textarea", rows: 3, gridSpan: 6, alwaysVisible: true, alwaysEditable: true },
          { name: "terms", label: "Terms & Conditions", type: "textarea", rows: 3, gridSpan: 6, alwaysVisible: true, alwaysEditable: true },
        ],
      },
    ],
  },
  validationSchema: z.object({
    party_id: z.union([z.string(), z.number()]).refine((value) => String(value || "").length > 0, "Customer or lead is required"),
    customer_id: z.union([z.coerce.number().positive(), z.literal(""), z.null()]).optional(),
    lead_id: z.union([z.coerce.number().positive(), z.literal(""), z.null()]).optional(),
    quotation_date: z.string().min(1, "Quotation date is required"),
    valid_until: z.string().min(1, "Valid until date is required"),
    timeframe: z.string().trim().max(100, "Timeframe cannot exceed 100 characters").nullish(),
    quotation_status: z.enum(quotationStatusOptions.map((status) => status.value)),
    items: z.array(itemSchema).min(1, "Add at least one product"),
  }).refine((data) => data.valid_until >= data.quotation_date, {
    path: ["valid_until"],
    message: "Must be on or after quotation date",
  }),
};

export const quotationsFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(quotationsModuleSchema.defaultColumns, {
    columnMappings: quotationsModuleSchema.columnMappings,
    tableCellConfig: quotationsModuleSchema.tableCellConfig,
  }),
];
