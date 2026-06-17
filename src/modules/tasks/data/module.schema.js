import { readonly, z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

// const auth_id = window.localStorage.getItem('auth_id')
const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];
const ASSIGNEE = window.localStorage.getItem('_auth_id');
const normalizeText = (value = "") => String(value || "").trim().toLowerCase();
const isCustomizationQuery = (values = {}) => {
  const queryTypeName = normalizeText(values.query_type_name || values.query_type_label || "");
  return queryTypeName === "customization" || queryTypeName === "customizations";
};

const getSelectedProductAddOns = (values = {}) => {
  const products = Array.isArray(values.customer_products) ? values.customer_products : [];
  const selectedProduct = products.find((product) => String(product.product_id) === String(values.product_id));
  const addOns = Array.isArray(selectedProduct?.add_ons) ? selectedProduct.add_ons : [];
  return addOns.filter(Boolean);
};

export const ticketsModuleSchema = {
  title: "Tickets",
  description: "Manage Tickets, priorities, assignments, and project tracking from one place.",
  menu_id: null, // set once menu record exists in DB
  primaryKey: "ticket_id",
  api: {
    list: "/tickets",
    delete: "/tickets/delete",
    create: "/tickets/create",
    edit: "/tickets",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "Ticket",
  },
  staticJoined: [],
  tableCellConfig: [
    { column_name: "client_id", type: "person" },
    // { column_name: "contact_person", type: "person" },
    { column_name: "query_type", type: "badge", color_field: "type_color" },
    { column_name: "ticket_status", type: "badge", color_field: "status_color" },
    { column_name: "ticket_priority", type: "tag", color_field: "priority_color" },
    // { column_name: "assignee", type: "person" }
  ],
  kanban: {
    enabled: true,
    categoryParentSlug: "ticket_status",
    categoryTableName: "categories",
    categorySelectFields: "category_id,categoryName,cat_color",
    categorySearchField: "categoryName",
    categoryValueKey: "category_id",
    categoryLabelKey: "categoryName",
    categoryColorKey: "cat_color",
    statusField: "ticket_status",
    idField: "ticket_id",
    titleField: "ticket_no",
    updateApi: "/tickets/update-status",
    appendIdToUpdateApi: true,
    updateMethod: "POST",
    buildUpdateBody: (row, targetColumnId) => ({
      ticket_status: targetColumnId,
    }),
    cardFields: [
      { key: "ticket_visibility_label", label: "View", type: "badge", colorField: "ticket_visibility_color" },
      { key: "client_id", label: "Client" },
      { key: "assignee", label: "Assignee" },
      { key: "query_type", label: "Type", type: "badge", colorField: "type_color" },
      { key: "due_date", label: "Due", type: "date" },
      { key: "ticket_priority", label: "Priority", type: "tag", colorField: "priority_color" },
      { key: "work_status", label: "Work Status", type: "tag" },
    ],
  },
  defaultColumns: ["client_id", "query_type", "ticket_status", "assignee", "ticket_priority", "start_date", "due_date"],
  skipFields: [],
  columnMappings: [
    { "client_id": "Customer Name" },
    { "product_add_ons": "Add-on" }
  ],
  savedFilters: [],
  form: {
    initialValues: {
      ticket_id: null,
      client_id: null,
      product_id: null,
      product_name: null,
      product_serial_number: null,
      product_add_ons: "",
      customer_products: [],
      contact_no: null,
      description: null,
      query_type: null,
      ticket_status: "205",
      ticket_priority: null,
      expected_minutes: null,
      assignee: ASSIGNEE || null,
      start_date: new Date().toISOString().split("T")[0],
      due_date: null,
      visit_required: 'n',
      company_id: null,
      created_by: null,
      modified_by: null,
      status: "active",
    },
    // Two-column layout matching the screenshot
    sections: [
      {
        columns: 2,
        fields: [
          {
            name: "client_id",
            label: "Client Name",
            type: "smartSelectInput",
            required: true,
            id: "client_id",
            gridSpan: 8,
            readOnlyWhen: (values) => Boolean(values.ticket_id),
            config: {
              type: "customer",
              source: "customer",
              list: "customer_id,name,created_date,mobile_no,email,contact_person, customer_products",
              placeholder: "Select Client",
              allowAddNew: true,
              multi: false,
              getValue: (item) => item.customer_id,
              // getLabel: (item) => {

              //   console.log("item :",item);
              //   return item.name || "Unnamed Client"
              // },
              getLabel: (item) => {
                const serialNumbers =
                  item.customer_products?.length
                    ? item.customer_products
                      .map(product => product.serial_number)
                      .filter(Boolean)
                      .join(", ")
                    : "";

                return serialNumbers
                  ? `${item.name} (${serialNumbers})`
                  : (item.name || "Unnamed Client");
              }
            },
          },
          {
            name: "visit_required",
            label: "Is visit required?",
            type: "radio",
            gridSpan: 4,
            options: [
              { value: "y", label: "Yes" },
              { value: "n", label: "No" },
            ],
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            name: "product_id",
            label: "Product",
            type: "select",
            placeholder: "Select product",
            gridSpan: 12,
            visibleWhen: (values) => Boolean(values.client_id),
            options: (values) => (Array.isArray(values.customer_products) ? values.customer_products : []).map((product) => ({
              value: product.product_id,
              label: `${product.product_name || "Unnamed Product"}${product.serial_number ? ` - ${product.serial_number}` : ""}`,
            })),
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            name: "query_type",
            label: "Query Type",
            type: "smartSelect",
            id: "query_type",
            gridSpan: 6,
            required: true,
            config: {
              apiUrl: "/system/searchSlugList",
              tableName: "categories",
              selectFields: "category_id,categoryName",
              searchField: "categoryName",
              slug: 'query_types',
              status: 'active',
              labelKey: "categoryName",
              valueKey: "category_id",
              placeholder: "Select Ticket Type",
              multi: false,
            },
          },
          {
            name: "product_add_ons",
            label: "Add-ons",
            type: "select",
            placeholder: "Select add-on",
            gridSpan: 6,
            visibleWhen: (values) => Boolean(values.client_id && values.product_id && isCustomizationQuery(values) && getSelectedProductAddOns(values).length),
            options: (values) => getSelectedProductAddOns(values).map((addOn) => ({
              value: addOn,
              label: addOn,
            })),
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            name: "contact_person",
            label: "Contact Person",
            type: "text",
            placeholder: "Enter Contact Person Name",
            gridSpan: 6,
            readOnlyWhen: (values) => Boolean(values.ticket_id),
            required: true,
          },
          {
            name: "contact_no",
            label: "Contact Number",
            type: "text",
            required: true,
            placeholder: "+1 (555) 000-0000",
            gridSpan: 6,
            readOnlyWhen: (values) => Boolean(values.ticket_id),
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            name: "ticket_priority",
            label: "Priority",
            type: "smartSelect",
            id: "ticket_priority",
            gridSpan: 6,
            config: {
              apiUrl: "/system/searchSlugList",
              tableName: "categories",
              selectFields: "category_id,categoryName",
              searchField: "categoryName",
              labelKey: "categoryName",
              slug: 'ticket_priority',
              status: 'active',
              valueKey: "category_id",
              placeholder: "Select Ticket Priority",
              multi: false,
            },
          },
          {
            name: "expected_minutes",
            label: "Expected Time (Minutes)",
            type: "number",
            placeholder: "Ex. 120",
            gridSpan: 6,
            readOnlyWhen:(values) => Boolean(!values.ticket_status || values.ticket_status !== 205),
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "assignee",
            label: "Assigned To",
            type: "smartSelectInput",
            required: true,
            id: "assignee",
            gridSpan: 12,
            config: {
              apiUrl: "/system/searchAssignee",
              type: "assignee",
              source: "admin",
              list: "adminID,name,status",
              check: "name",
              getValue: (item) => item.adminID,
              getLabel: (item) => item.name || "Unnamed Assignee",
              countKey: "pending_tickets_count",
              countLabel: "pending",
              placeholder: "Select Assignee",
              multi: false
            }
          },
        ],
      },
      {
        columns: 2,
        fields: [
          { name: "start_date", label: "Start Date", type: "date", placeholder: "Select a date", gridSpan: 6 },
          { name: "due_date", label: "Due Date", type: "date", required: true, placeholder: "Select a date", gridSpan: 6 },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "ticket_status",
            label: "Ticket Status",
            type: "smartSelect",
            id: "ticket_status",
            gridSpan: 12,
            config: {
              apiUrl: "/system/searchSlugList",
              tableName: "categories",
              selectFields: "category_id,categoryName",
              searchField: "categoryName",
              slug: 'ticket_status',
              status: 'active',
              labelKey: "categoryName",
              valueKey: "category_id",
              placeholder: "Select Ticket Status",
              multi: false,
            },
            visibleWhen: (values) => Boolean(values.ticket_id),
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "reason",
            label: "Reason",
            type: "text",
            placeholder: "Enter reason",
            gridSpan: 12,
            required: true,
            visibleWhen: (values, oldValues, mode) => mode === "edit" &&
              (
                String(values.assignee || "") !== String(oldValues.assignee || "") ||
                String(values.due_date || "") !== String(oldValues.due_date || "")
              ),
          },
        ],
      },
      {
        columns: 1,
        fields: [
          { name: "description", required: true, label: "Description", type: "editor", placeholder: "Provide details about the ticket...", gridSpan: 12 },
        ]
      },
    ],
  },
  validationSchema: z.object({
    client_id: z.coerce.number().min(1, "Customer is Required!"),
    description: z.string().nullable().transform(v => v ?? "").pipe(z.string().trim().min(1, "Description is Required!")),
    contact_person: z.string().nullable().optional().transform(v => v ?? "").refine(v => v === "" || v.trim().length > 0, "Contact person name required"),
    contact_no: z.string().nullable().optional().transform(v => v ?? "").refine(v => v === "" || /^[0-9]\d{9}$/.test(v), "Enter valid 10-digit mobile number"),
    start_date: z.coerce.date({ required_error: "Start date is Required!", invalid_type_error: "Start date is Required!", }),
    due_date: z.coerce.date({ required_error: "Due date is Required!", invalid_type_error: "Due date is Required!", }),
    query_type: z.coerce.number().min(1, "Query type is Required!"),
    product_add_ons: z.string().nullable().optional().default(""),
    expected_minutes: z.coerce.number().nullable().optional(),
    ticket_status: z.coerce.number().min(1, "Ticket status is Required!"),
    ticket_priority: z.coerce.number().min(1, "Ticket priority is Required!"),
    status: z.string().nullable().default("active"),
  }).refine((data) => {
    if (!data.start_date || !data.due_date) return true; // avoid crash
    return data.due_date >= data.start_date;
  }, { message: "Due date must be after Start date", path: ["due_date"], })
};

export const ticketsFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(ticketsModuleSchema.defaultColumns, {
    columnMappings: ticketsModuleSchema.columnMappings,
    tableCellConfig: ticketsModuleSchema.tableCellConfig
  }),
];
