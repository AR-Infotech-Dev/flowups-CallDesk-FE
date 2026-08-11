import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

export const productsModuleSchema = {
  title: "Products",
  description: "Manage product names, product types, and descriptions from one place.",
  menu_id: null,
  primaryKey: "product_id",
  api: {
    list: "/products",
    delete: "/products/delete",
    create: "/products/create",
    edit: "/products",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "products",
  },
  staticJoined: [],
  tableCellConfig: [
    { column_name: "product_name", type: "person" },
    { column_name: "product_type", type: "tag" },
    { column_name: "rate", type: "currency" },
    { column_name: "product_description", type: "clip" },
  ],
  defaultColumns: ["product_name", "product_type", "rate", "gst_rate", "product_description"],
  skipFields: ["company_id", "created_by", "created_date", "modified_by", "modified_date"],
  columnMappings: [
    { product_name: "Product/Service Name" },
    { product_type: "Product/Service Type" },
    { rate: "Rate" },
    { gst_rate: "GST Rate (%)" },
    { product_description: "Description" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      product_id: null,
      product_name: "",
      product_type: "",
      product_description: "",
      rate: 0,
      gst_rate: 0,
      company_id: null,
    },
    sections: [
      {
        columns: 2,
        fields: [
          { name: "product_name", label: "Product/Service Name", type: "text", required: true, placeholder: "Enter product name", gridSpan: 6 },
          { name: "product_type", label: "Product/Service Type", type: "text", required: true, placeholder: "Enter product type", gridSpan: 6 },
        ],
      },
      {
        columns: 2,
        fields: [
          { name: "rate", label: "Rate", type: "number", required: true, min: 0, step: "0.01", placeholder: "Enter product rate", gridSpan: 6 },
          { name: "gst_rate", label: "GST Rate (%)", type: "number", required: true, min: 0, max: 100, step: "0.01", placeholder: "Enter GST rate", gridSpan: 6 },
        ],
      },
      {
        columns: 1,
        fields: [
          { name: "product_description", label: "Description", type: "textarea", rows: 3, placeholder: "Enter product description", gridSpan: 12 },
        ],
      },
    ],
  },
  validationSchema: z.object({
    product_name: z.string().trim().min(1, "Product/Service name is required"),
    product_type: z.any().optional(),
    rate: z.number({ invalid_type_error: "Rate must be a valid number" }).min(0, "Rate cannot be negative"),
    gst_rate: z.number({ invalid_type_error: "GST rate must be a valid number" }).min(0, "GST rate cannot be negative").max(100, "GST rate cannot exceed 100"),
    product_description: z.union([z.literal(null), z.string()]).optional(),
    company_id: z.any().optional(),
  }),
};

export const productsFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(productsModuleSchema.defaultColumns, {
    columnMappings: productsModuleSchema.columnMappings,
    tableCellConfig: productsModuleSchema.tableCellConfig,
  }),
];
