import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";
import { z } from "zod";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
  // { key: "favorite", className: "icon-col", width: 42, minWidth: 42, resizable: false },
];
export const usersModuleSchema = {
  // Copy this object for the next module and update API paths, joined tables,
  // default columns, skip fields, label mappings, and form sections only.
  title: "Users",
  description: "Manage users, roles, company assignment, and approval access from one place.",
  menu_id: 20,
  primaryKey: 'adminID',
  api: {
    list: "/users",
    delete: "/users/delete",
    create: "/users/create",
    edit: "/users",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "user",
  },
  staticJoined: [
    // Keep joined field metadata here so future modules can reuse the same pattern.
    // If you have dropdown APIs later, options can be filled dynamically from here.
    {
      field: "roleID",
      fieldtype: "joined",
      joinedTable: "user_role_master",
      select: "roleID,roleName",
      primaryKey: "roleID",
      labelKey: "roleName",
      slug: "",
      options: [],
    },
    {
      field: "default_company",
      fieldtype: "company",
      joinedTable: "company_master",
      select: "company_id,company_name",
      primaryKey: "company_id",
      labelKey: "company_name",
      slug: "",
      options: [],
    },
  ],
  defaultColumns: ["name", "userName", "email", "contactNo", "roleID", "status", "company_id"],
  skipFields: ["user_setting", "gfcmToken", "otp", "country_code", "otp_exp_time", "g_cal_token", "one_drive_access_token", "is_google_sync", "is_one_drive_sync", "ftoken", "isVerified", "photo", "adminID", "latitude", "longitude", "roleOfUser", "password"],
  tableCellConfig: [
    { column_name: "name", type: "person" },
    { column_name: "userName", type: "person" },
    { column_name: "roleID", type: "tag" },
    { column_name: "status", type: "badge", color_field: "status_color" },
  ],
  columnMappings: [
    { is_sys_user: "System User" },
    { isEmailSend: "Verification Email Sent" },
    { contactNo: "Contact No" },
    { whatsappNo: "Whatsapp No" },
    { dateOfBirth: "Date Of Birth" },
    { lastLogin: "Last Login" },
    { company_id: "Assigned Company" },
    { userName: "User Name" },
    { roleID: "User Role" },
    { is_approver: "Approval Privileges" },
    { otp: "OTP" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      adminID: null,
      name: null,
      default_company: null,
      time_zone: "Asia/Kolkata",
      company_id: null,
      is_approver: "no",
      userName: null,
      email: null,
      isEmailSend: "no",
      password: null,
      is_sys_user: "no",
      roleID: null,
      address: null,
      google_location: null,
      contactNo: null,
      whatsappNo: null,
      dateOfBirth: null,
      created_by: null,
      modified_by: null,
      status: "inactive",
    },
    sections: [
      // `columns` decides the grid and each field controls label/type/required state.
      {
        columns: 3,
        fields: [
          { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter name" },
          { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter email" },
          { name: "dateOfBirth", label: "Date of birth", type: "date", required: true, placeholder: "Birth date" },
        ]
      },
      {
        columns: 3,
        fields: [
          { name: "userName", label: "User Name", type: "text", required: true, disabled: true, placeholder: "Enter user name" },
          { name: "whatsappNo", label: "Whatsapp Number", type: "text", placeholder: "Enter whatsapp number" },
          {
            name: "time_zone",
            label: "Time Zone",
            type: "select",
            options: [
              { value: "Asia/Kolkata", label: "(UTC+05:30) India Standard Time (IST)" },
              { value: "UTC+04:00", label: "(UTC+04:00) Gulf Standard Time (GST)" },
              { value: "UTC+00:00", label: "(UTC+00:00) Greenwich Mean Time (GMT)" },
            ],
          },
        ],
      },
      {
        columns: 3,
        fields: [
          {
            name: "roleID",
            label: "User Role",
            type: "smartSelect",
            required: true,
            id: "roleID",
            config: {
              apiUrl: "/system/searchList",
              tableName: "user_role_master",
              selectFields: "roleName,roleID",
              searchField: "roleName",
              labelKey: "roleName",
              valueKey: "roleID",
              placeholder: "Select Role",
              multi: false
            }
          },
          {
            name: "company_id",
            label: "Company",
            type: "smartSelect",
            required: true,
            id: "company_id",
            config: {
              apiUrl: "/system/searchList",
              tableName: "company_master",
              selectFields: "company_name,company_id",
              searchField: "company_name",
              labelKey: "company_name",
              valueKey: "company_id",
              placeholder: "Select Company",
              multi: false
            }
          },
          {
            name: "is_approver",
            label: "Approval Privileges",
            type: "radio",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
        ]
      },
      {
        columns: 3,
        fields: [
          { name: "google_location", label: "Google Location", type: "text", placeholder: "Enter google location" },
          {
            name: "status",
            label: "Status",
            type: "radio",
            required: true,
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          // {
          //   name: "roleID",
          //   label: "User Role",
          //   type: "smartSelect",
          //   required: true,
          //   id: "roleID",
          //   config: {
          //     type: 'roles',
          //     valueKey: 'role_id',
          //     source: 'user_role_master',
          //     statusCheck: true,
          //     getLabel: (item) => `${item.roleName}`,
          //     getValue: (item) => item.roleID,
          //     placeholder: 'Select Role',
          //     list: "roleName,roleID",
          //     allowAddNew: false, preload: false, cache: false, showRecent: false
          //   },
          //   // <SmartSelectInput
          //   //     id="customer" label="" value={defaultFormData?.customer_id}
          //   //     onSelect={(data) => {
          //   //       handleInputChange("customer_id", data)
          //   //     }}
          //   //     onObjectSelect={() => { }}
          //   // config={{
          //   //   type: 'customer', valueKey: 'customer_id', source: 'customer', statusCheck: true,
          //   //   getLabel: (item) => `${item.name}`,
          //   //   getValue: (item) => item.customer_id,
          //   //   placeholder: 'Select Customer',
          //   //   list: "name,customer_id",
          //   //   allowAddNew: true, preload: true, cache: true, showRecent: true
          //   // }}
          //   //   />
          // },

        ],
      },

      {
        columns: 1,
        fields: [
          { name: "address", label: "Address", type: "editor", placeholder: "Enter address", rows: 4 },
        ],
      },
    ],
  },
  // validationSchema: z.object({
  //   name: z.string().min(1, "Name is required").nullable(),
  //   userName: z.string().min(3, "Username must be at least 3 characters"),
  //   email: z.string().email("Invalid email address"),
  //   dateOfBirth: z.coerce.date()
  //     .min(new Date("1900-01-01"), { message: "Too old" })
  //     .max(new Date(), { message: "Birth date cannot be in the future" }),
  //   roleID: z.any().refine((value) => value !== "" && value !== null && value !== undefined, {
  //     message: "Role is required",
  //   }),
  //   status: z.string()
  // })
  validationSchema: z.object({
    name: z.string().nullable().refine((val) => val !== null && val.trim() !== "", {
      message: "Name is required",
    }),
    userName: z.string().nullable().refine((val) => val !== null && val.trim() !== "", {
      message: "User Name is required",
    }),
    email: z.string().nullable().refine((val) => val !== null && val.trim() !== "", {
      message: "Email is required",
    }).refine((val) => /\S+@\S+\.\S+/.test(val), {
      message: "Invalid email address",
    }),
    dateOfBirth: z.coerce.date().nullable()
      .refine((val) => val !== null, {
        message: "Date of Birth is required",
      })
      .refine((val) => val && val >= new Date("1900-01-01"), {
        message: "Too old",
      })
      .refine((val) => val && val <= new Date(), {
        message: "Birth date cannot be in the future",
      }),
    roleID: z.any().refine((value) => value !== "" && value !== null && value !== undefined, {
      message: "Role is required",
    }),
    status: z.string()
  })
};

export const usersFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(usersModuleSchema.defaultColumns, {
    columnMappings: usersModuleSchema.columnMappings,
    tableCellConfig: usersModuleSchema.tableCellConfig,
  }),
];
