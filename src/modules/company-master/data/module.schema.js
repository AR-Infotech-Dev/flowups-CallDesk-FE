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

const MAIL_PROVIDER_OPTIONS = [
  { value: "gmail", label: "Gmail" },
  { value: "yahoo", label: "Yahoo" },
  { value: "outlook", label: "Outlook / Microsoft 365" },
  { value: "custom", label: "Custom SMTP" },
];

const SMTP_ENCRYPTION_OPTIONS = [
  { value: "tls", label: "TLS" },
  { value: "ssl", label: "SSL" },
  { value: "none", label: "None" },
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
    testMail: "/companies/mail-config/test",
    testDB: "/companies/db-config/test",
    logoUpload: "/companies/logo",
    logoRemove: "/companies/:id/logo/remove",
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
    { column_name: "sender_email", type: "clip" },
    { column_name: "cc_email", type: "clip" },
    { column_name: "date_format", type: "tag" },
    { column_name: "status", type: "badge" },
  ],
  defaultColumns: ["company_name", "sender_email", "mobile_number", "city", "date_format", "status"],
  skipFields: ["created_by", "created_date", "modified_by", "modified_date"],
  columnMappings: [
    { sender_email: "Sender Email" },
    { cc_email: "CC Email" },
    { sender_name: "Sender Name" },
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
      sender_email: "",
      cc_email: "",
      sender_name: "",
      mail_provider: "gmail",
      smtp_host: "smtp.gmail.com",
      smtp_port: "587",
      smtp_encryption: "tls",
      smtp_username: "",
      mail_connection_status: "not_tested",
      mail_last_tested_at: null,
      mobile_number: "",
      company_address: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      pan: "",
      time_format: "DD-MM-YYYY",
      date_format: "DD-MM-YYYY",
      email_logo: "",
      email_app_password: "",
      created_by: null,
      created_date: null,
      modified_by: null,
      modified_date: null,
      ticket_prefix: null,
      ticket_include_year: 'y',
      ticket_prefix_padding: 3,
      ticket_no_reset: 'yearly',
      // OWN DB CONFIG
      own_db_enabled: 'no',
      db_type: null,
      db_host: null,
      db_port: null,
      db_name: null,
      db_username: null,
      db_password: null,
      db_ssl_enabled: 'no',
      db_status: 'not_connected',

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
          { name: "mail_provider", label: "Mail Provider", type: "select", required: true, gridSpan: 4, options: MAIL_PROVIDER_OPTIONS },
          { name: "sender_email", label: "Sender Email", type: "email", required: true, placeholder: "Enter sender email", gridSpan: 4 },
          { name: "sender_name", label: "Sender Name", type: "text", placeholder: "Enter sender name", gridSpan: 4 },
          { name: "cc_email", label: "CC Email", type: "email", placeholder: "Enter CC email", gridSpan: 4 },
          // { name: "email_app_password", label: "Email App Password", type: "password", placeholder: "Enter email app password", gridSpan: 4 },
          { name: "email_app_password", label: "Email App Password", type: "text", placeholder: "Enter email app password", gridSpan: 4 },
        ],
      },
      {
        columns: 4,
        fields: [
          { name: "smtp_host", label: "SMTP Host", type: "text", required: true, placeholder: "smtp.gmail.com", gridSpan: 4, visibleWhen: (values) => values.mail_provider === "custom" },
          { name: "smtp_username", label: "SMTP Username", type: "text", required: true, placeholder: "Enter SMTP username", gridSpan: 4, visibleWhen: (values) => values.mail_provider === "custom" },
          { name: "smtp_port", label: "SMTP Port", type: "text", required: true, placeholder: "587", gridSpan: 2, visibleWhen: (values) => values.mail_provider === "custom" },
          { name: "smtp_encryption", label: "Encryption", type: "select", required: true, gridSpan: 2, options: SMTP_ENCRYPTION_OPTIONS, visibleWhen: (values) => values.mail_provider === "custom" },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "date_format", label: "Date Format", type: "select", gridSpan: 4, options: DATE_FORMAT_OPTIONS },
          { name: "time_format", label: "Time Format", type: "select", gridSpan: 4, options: DATE_FORMAT_OPTIONS },
        ],
      },
      {
        title: "Ticket Settings",
        columns: 2,
        fields: [
          { name: "ticket_prefix", label: "Ticket Prefix", type: "text", placeholder: "TKT", required: true, gridSpan: 3, },
          { name: "ticket_prefix_padding", label: "Padding", type: "text", placeholder: "TKT", gridSpan: 3, },
          { name: "ticket_include_year", label: "Include Date", type: "radio", options: [{ label: "Yes", value: "y" }, { label: "No", value: "n" },], gridSpan: 3, },
          { name: "ticket_no_reset", label: "Reset preference", type: "radio", options: [{ label: "Daily", value: "daily" }, { label: "Monthly", value: "monthly" }, { label: "Yearly", value: "yearly" },], gridSpan: 3, },
        ],
      },
      {
        title: 'Database Settings',
        icon: Settings,
        columns: 3,
        fields: [
          { name: "own_db_enabled", label: "Own DB Enabled", type: "radio", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], gridSpan: 3 },
        ],
      },
      {
        columns: 3,
        fields: [
          { name: "db_type", label: "DB Type", type: "input", required: true, placeholder: "Enter database type", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_name", label: "DB Name", type: "input", required: true, placeholder: "Enter database name", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_host", label: "DB Hostname", type: "input", required: true, placeholder: "Enter database hostname", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_port", label: "DB Port", type: "input", required: true, placeholder: "Enter database port", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_username", label: "DB Username", type: "input", required: true, placeholder: "Enter database username", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_password", label: "DB Password", type: "password", required: true, placeholder: "Enter database password", gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
          { name: "db_ssl_enabled", label: "SSL Enabled", type: "radio", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], gridSpan: 4, visibleWhen: (values) => Boolean(values.own_db_enabled === 'yes') },
        ],
      },
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
    ticket_prefix: z.string().trim().min(1, "Ticket Prefix is required"),
    cc_email: z.union([z.literal(""), z.string().trim().email("Invalid CC email address")]).optional(),
    sender_email: z.string().trim().email("Invalid from email address"),
    sender_name: z.string().optional(),
    mail_provider: z.enum(["gmail", "yahoo", "outlook", "custom"]).default("gmail"),
    smtp_host: z.string().optional(),
    smtp_port: z.string().optional(),
    smtp_encryption: z.enum(["tls", "ssl", "none"]).optional(),
    smtp_username: z.string().optional(),
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
    time_format: z.string().trim().min(1, "Time format is required"),
    email_logo: z.string().optional(),
    status: z.enum(["active", "inactive", "delete"]),
  }).superRefine((data, ctx) => {
    if (data.mail_provider !== "custom") return;

    ["smtp_host", "smtp_port", "smtp_encryption", "smtp_username"].forEach((field) => {
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field.replaceAll("_", " ")} is required`,
        });
      }
    });
  }),
};

export const companyMasterFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(companyMasterSchema.defaultColumns, {
    columnMappings: companyMasterSchema.columnMappings,
    tableCellConfig: companyMasterSchema.tableCellConfig,
  }),
];
