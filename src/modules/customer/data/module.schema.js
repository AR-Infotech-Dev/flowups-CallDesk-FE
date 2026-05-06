import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

export const customerModuleSchema = {
  title: "Customer",
  description: "Manage customer profile, contacts, company mapping, and billing details from one place.",
  menu_id: null,
  primaryKey: "customer_id",
  api: {
    list: "/customers",
    delete: "/customers/delete",
    create: "/customers/create",
    edit: "/customers",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "customer",
  },
  staticJoined: [],
  tableCellConfig: [
    { column_name: "name", type: "person" },
    { column_name: "email", type: "clip" },
    { column_name: "company_name", type: "tag" },
    { column_name: "billing_name", type: "tag" },
  ],
  defaultColumns: ["name", "email", "mobile_no", "company_name", "billing_name"],
  skipFields: ["created_by", "created_date", "modified_by"],
  columnMappings: [
    { mobile_no: "Mobile No" },
    { wa_no: "WhatsApp No" },
    { birth_date: "Birth Date" },
    { pan_number: "PAN Number" },
    { company_name: "Company Name" },
    { billing_name: "Billing Name" },
    { billing_address: "Billing Address" },
    { mailing_address: "Mailing Address" },
    { company_id: "Mapped Company" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      customer_id: null,
      name: "",
      email: null,
      mobile_no: "",
      wa_no: null,
      birth_date: null,
      address: null,
      pan_number: null,
      company_name: null,
      billing_name: null,
      billing_address: null,
      company_id: null,
      mailing_address: "",
      created_by: null,
      created_date: null,
      modified_by: null,
    },
    sections: [
      {
        columns: 1,
        fields: [
          { name: "name", label: "Customer Name", type: "text", required: true, placeholder: "Enter customer name", gridSpan: 6 },
        ],
      },
      {
        columns: 4,
        fields: [
          { name: "contact_person", label: "Contact Person", type: "text", placeholder: "Enter placeholder name", gridSpan: 4 },
          { name: "mobile_no", label: "Mobile No", type: "text", required: true, placeholder: "Enter mobile number", gridSpan: 4 },
          { name: "pan_number", label: "PAN Number", type: "text", placeholder: "Enter PAN number", gridSpan: 4 },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "email", label: "Email", type: "email", placeholder: "Enter email address", gridSpan: 4},
          { name: "wa_no", label: "WhatsApp No", type: "text", placeholder: "Enter WhatsApp number", gridSpan: 4 },
          { name: "gst_number", label: "GST Number", type: "text", placeholder: "Enter GST number", gridSpan: 4 },
        ],
      },
      {
        columns: 1,
        fields: [
          { name: "address", label: "Address", type: "textarea", rows: 3, placeholder: "Enter primary address", gridSpan: 12 },
        ],
      },
    ],
  },
  validationSchema: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    email: z.union([z.literal(null), z.string().email("Invalid email address")]).optional(),
    mobile_no: z.string().trim().min(10, "Mobile number is required"),
    wa_no: z.union([z.literal(null), z.string()]).optional(),
    addno: z.string().optional(),
    birress: z.string().optional(),
    pan_number: z.union([
      z.literal(null),
      z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number"),
    ]).optional(),
  }),
};

export const customerFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(customerModuleSchema.defaultColumns, {
    columnMappings: customerModuleSchema.columnMappings,
    tableCellConfig: customerModuleSchema.tableCellConfig,
  }),
];
