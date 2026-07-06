import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";
const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

const optionalEmailSchema = z.preprocess(
  (value) => value ?? "",
  z.union([z.literal(""), z.string().trim().email("Invalid email address")])
);

const customerContactSchema = z.object({
  contact_id: z.union([z.literal(null), z.coerce.number(), z.string()]).optional(),
  customer_id: z.union([z.literal(null), z.coerce.number(), z.string()]).optional(),
  name: z.string().trim().min(1, "Contact name is required"),
  designation: z.string().optional(),
  mobile_no: z.string().trim().min(1, "Mobile number is required").regex(/^[0-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  email: z.preprocess((value) => value ?? "", z.string().trim().min(1, "Email is required").email("Invalid email address")),
  department: z.string().optional(),
  is_primary: z.enum(["y", "n"]).optional(),
});

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
    downloadExcel: "/customers/download-excel",
    importTemplate: "/customers/import-template",
    import: "/customers/import",
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
    { column_name: "is_amc", type: "badge" },
    { column_name: "customer_products", type: "customerProducts", width: 320, minWidth: 260 },
  ],
  defaultColumns: ["name", "email", "mobile_no", "is_amc"],
  filterFieldOptions: {
    company_id: {
      type: "select",
      optionsSource: {
        apiUrl: "/system/searchList",
        body: {
          tableName: "company_master",
          list: "company_id,company_name",
          wherec: "company_name",
        },
        rowsPath: ["data"],
        valueKey: "company_id",
        labelKey: "company_name",
      },
    },
  },
  skipFields: ["company_name"],
  columnMappings: [
    { mobile_no: "Mobile No" },
    { wa_no: "WhatsApp No" },
    { birth_date: "Birth Date" },
    { pan_number: "PAN Number" },
    { company_name: "Company Name" },
    { billing_name: "Billing Name" },
    { billing_address: "Billing Address" },
    { mailing_address: "Mailing Address" },
    { company_id: "Company" },
    { customer_products: "Products" },
    { is_amc: "AMC" },
    { amc_term_period: "Term Period" },
    { amc_start_date: "AMC Start Date" },
    { amc_end_date: "AMC End Date" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      customer_id: null,
      name: "",
      // contact_person: null,
      // email: null,
      // mobile_no: "",
      wa_no: null,
      birth_date: null,
      address: null,
      pan_number: null,
      company_name: null,
      billing_name: null,
      billing_address: null,
      company_id: null,
      mailing_address: "",
      is_amc: "no",
      amc_term_period: null,
      amc_start_date: null,
      amc_end_date: null,
      responsible_person: null,
      exp_call_count: null,
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
      // {
      //   columns: 4,
      //   fields: [
      //     { name: "contact_person", label: "Contact Person", type: "text", placeholder: "Enter placeholder name", gridSpan: 4 },
      //     { name: "mobile_no", label: "Mobile No", type: "text", required: true, placeholder: "Enter mobile number", gridSpan: 4 },
      //     { name: "email", label: "Email", type: "email", placeholder: "Enter email address", required: true, gridSpan: 4 },
      //   ],
      // },
      {
        columns: 3,
        fields: [
          { name: "pan_number", label: "PAN Number", type: "text", placeholder: "Enter PAN number", gridSpan: 6 },
          { name: "gst_number", label: "GST Number", type: "text", placeholder: "Enter GST number", gridSpan: 6 },
          // { name: "wa_no", label: "WhatsApp No", type: "text", placeholder: "Enter WhatsApp number", gridSpan: 4 },
        ],
      },
      {
        columns: 1,
        fields: [
          { name: "address", label: "Address", type: "textarea", rows: 3, placeholder: "Enter primary address", gridSpan: 12 },
        ],
      },
      {
        columns: 4,
        fields: [
          {
            name: "is_amc",
            label: "Is AMC",
            type: "radio",
            gridSpan: 3,
            alwaysVisible: true,
            alwaysEditable: true,
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
          {
            name: "amc_term_period",
            label: "Term Period",
            type: "select",
            gridSpan: 3,
            alwaysVisible: true,
            alwaysEditable: true,
            visibleWhen: (values) => values.is_amc === "yes",
            options: [
              { value: "3_month", label: "3 Month" },
              { value: "6_month", label: "6 Month" },
              { value: "yearly", label: "Yearly" },
            ],
          },
          {
            name: "amc_start_date",
            label: "AMC Start Date",
            type: "date",
            gridSpan: 3,
            alwaysVisible: true,
            alwaysEditable: true,
            visibleWhen: (values) => values.is_amc === "yes",
          },
          {
            name: "amc_end_date",
            label: "AMC End Date",
            type: "date",
            gridSpan: 3,
            alwaysVisible: true,
            alwaysEditable: true,
            visibleWhen: (values) => values.is_amc === "yes",
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            name: "responsible_person",
            label: "Responsible Person",
            type: "smartSelectInput",
            required: true,
            id: "responsible_person",
            gridSpan: 6,
            visibleWhen: (values) => values.is_amc === "yes",
            config: {
              apiUrl: "/system/searchAssignee",
              type: "assignee",
              source: "admin",
              list: "adminID,name",
              check: "name",
              getValue: (item) => item.adminID,
              getLabel: (item) => item.name || "Unnamed Assignee",
              placeholder: "Select Responsible Person",
              multi: false
            }
          },
          {
            name: "exp_call_count",
            label: "Expected call count (per month)",
            type: "number",
            gridSpan: 6,
            alwaysVisible: true,
            alwaysEditable: true,
            visibleWhen: (values) => values.is_amc === "yes",
          },
        ],
      },
    ],
  },
  validationSchema: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    // email: z.preprocess( (value) => value ?? "", z.string().trim().min(1, "Email is required").email("Invalid email address") ),
    // mobile_no: z.string().trim().min(10, "Mobile number is required"),
    wa_no: z.union([z.literal(null), z.string()]).optional(),
    is_amc: z.enum(["yes", "no"]).optional(),
    amc_term_period: z.union([z.literal(null), z.enum(["4_month", "6_month", "yearly"])]).optional(),
    amc_start_date: z.union([z.literal(null), z.string()]).optional(),
    amc_end_date: z.union([z.literal(null), z.string()]).optional(),
    responsible_person: z.union([z.literal(null), z.coerce.number()]).optional(),
    exp_call_count: z.union([z.literal(null), z.coerce.number()]).optional(),
    addno: z.string().optional(),
    birress: z.string().optional(),
    pan_number: z.union([
      z.literal(null),
      z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number"),
    ]).optional(),
    customer_contacts: z
      .array(customerContactSchema)
      .min(1, "At least one contact person is required")
      .refine(
        (contacts) => contacts.filter((contact) => contact.is_primary === "y").length <= 1,
        "Only one primary contact is allowed"
      )
      .refine(
        (contacts) => contacts.some((contact) => contact.is_primary === "y"),
        "One primary contact is required"
      ),
  }).superRefine((data, ctx) => {
    if (data.is_amc !== "yes") return;
    console.log('data : ', data);

    if (!data.responsible_person) {
      ctx.addIssue({
        code: "custom",
        path: ["responsible_person"],
        message: "Responsible Person is required",
      });
    }

    if (!data.exp_call_count) {
      ctx.addIssue({
        code: "custom",
        path: ["exp_call_count"],
        message: "Expected Call Count is required",
      });
    }

    if (!data.amc_term_period) {
      ctx.addIssue({
        code: "custom",
        path: ["amc_term_period"],
        message: "Term period is required",
      });
    }

    if (data.amc_start_date && data.amc_end_date && new Date(data.amc_end_date) < new Date(data.amc_start_date)) {
      ctx.addIssue({
        code: "custom",
        path: ["amc_end_date"],
        message: "AMC end date must be after start date",
      });
    }
  }),
};

export const customerFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(customerModuleSchema.defaultColumns, {
    columnMappings: customerModuleSchema.columnMappings,
    tableCellConfig: customerModuleSchema.tableCellConfig,
  }),
];
