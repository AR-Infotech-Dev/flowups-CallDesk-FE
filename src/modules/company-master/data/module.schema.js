import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";
import { Building, Settings } from "lucide-react";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
];

export const companyMasterSchema = {
  title: "Company Master",
  description: "Manage company profile, contact emails, address details, and formatting preferences from one place.",
  menu_id: null,
  primaryKey: "company_id",
  api: {
    list: "/companies",
    delete: "/companies/delete",
    create: "/companies/create",
    edit: "/companies",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "companyMaster",
  },
  staticJoined: [],
  tableCellConfig: [
    { column_name: "company_name", type: "person" },
    { column_name: "from_email", type: "clip" },
    { column_name: "cc_email", type: "clip" },
    { column_name: "date_format", type: "tag" },
    { column_name: "status", type: "badge" },
  ],
  defaultColumns: ["company_name", "from_email", "mobile_number", "city", "date_format", "status"],
  skipFields: ["created_by", "created_date", "modified_by", "modified_date"],
  columnMappings: [
    { from_email: "From Email" },
    { cc_email: "CC Email" },
    { from_name: "From Name" },
    { mobile_number: "Mobile Number" },
    { company_address: "Company Address" },
    { email_logo: "Email Logo" },
    { company_name: "Company Name" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      company_id: null,
      company_name: "",
      from_email: "",
      cc_email: "",
      from_name: "",
      mobile_number: "",
      company_address: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      pan: "",
      date_format: "DD-MM-YYYY",
      email_logo: "",
      created_by: null,
      created_date: null,
      modified_by: null,
      modified_date: null,
      status: "active",
    },
    sections: [
      {
        title: 'Company Details',
        icon: Building,
        columns: 2,
        fields: [
          { name: "company_name", label: "Company Name", type: "text", required: true, placeholder: "Enter company name", gridSpan: 6 },
          { name: "mobile_number", label: "Mobile Number", type: "text", placeholder: "Enter mobile number", gridSpan: 6 },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "country", label: "Country", type: "text", placeholder: "Enter country id/name", gridSpan: 4 },
          { name: "state", label: "State", type: "text", placeholder: "Enter state id/name", gridSpan: 4 },
          { name: "city", label: "City", type: "text", placeholder: "Enter city id/name", gridSpan: 4 },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "zip", label: "ZIP", type: "text", placeholder: "Enter ZIP code", gridSpan: 4 },
          { name: "pan", label: "PAN", type: "text", placeholder: "Enter PAN number", gridSpan: 4 },
        ],
      },
      {
        columns: 1,
        fields: [
          { name: "company_address", label: "Company Address", type: "textarea", rows: 3, placeholder: "Enter company address", gridSpan: 12 },
        ],
      },
      {
        title: 'Application Settings',
        icon: Settings,
        columns: 4,
        fields: [
          { name: "sender_name", label: "Sender Name", type: "text", placeholder: "Enter sender name", gridSpan: 4 },
          { name: "sender_email", label: "Sender Email", type: "email", required: true, placeholder: "Enter sender email", gridSpan: 4 },
          { name: "email_app_password", label: "Email App Password", type: "password", placeholder: "Enter email app password", gridSpan: 4 },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "date_format", label: "Date Format", type: "select", gridSpan: 4, options: DATE_FORMAT_OPTIONS },
        ],
      },
      // {
      //   columns: 2,
      //   fields: [
      //     { name: "email_logo", label: "Email Logo", type: "text", placeholder: "Enter logo URL/path", gridSpan: 6 },
      //   ],
      // },
      {
        columns: 2,
        fields: [
          {
            name: "status",
            label: "Status",
            type: "radio",
            gridSpan: 6,
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "delete", label: "Delete" },
            ],
          },
        ],
      },
    ],
  },
  validationSchema: z.object({
    company_name: z.string().trim().min(1, "Company name is required"),
    cc_email: z.union([z.literal(""), z.string().trim().email("Invalid CC email address")]).optional(),
    sender_email: z.string().trim().email("Invalid from email address"),
    sender_name: z.string().optional(),
    email_app_password: z.string().optional(),
    mobile_number: z.string().optional(),
    company_address: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    pan: z.union([
      z.literal(""),
      z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number"),
    ]).optional(),
    date_format: z.string().trim().min(1, "Date format is required"),
    email_logo: z.string().optional(),
    status: z.enum(["active", "inactive", "delete"]),
  }),
};

export const companyMasterFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(companyMasterSchema.defaultColumns, {
    columnMappings: companyMasterSchema.columnMappings,
    tableCellConfig: companyMasterSchema.tableCellConfig,
  }),
];
