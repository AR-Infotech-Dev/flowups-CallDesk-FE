import { z } from "zod";
import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

const CATEGORY_COLORS = [
  "#B91C1C", // deep red
  "#DC2626",
  "#EF4444",
  "#F97316", // orange
  "#EA580C",
  "#FB923C",
  "#D97706", // amber
  "#F59E0B",

  "#15803D", // green
  "#16A34A",
  "#22C55E",
  "#65A30D", // lime
  "#84CC16",
  "#4D7C0F",

  "#0F766E", // teal
  "#14B8A6",
  "#0891B2", // cyan
  "#06B6D4",

  "#1D4ED8", // blue
  "#2563EB",
  "#3B82F6",
  "#1E40AF", // dark blue

  "#4338CA", // indigo
  "#4F46E5",
  "#6366F1",

  "#6D28D9", // violet
  "#7C3AED",
  "#8B5CF6",

  "#A21CAF", // purple
  "#C026D3",
  "#D946EF",

  "#BE185D", // pink
  "#DB2777",
  "#EC4899",

  "#374151", // gray
  "#4B5563",
  "#111827", // near black

  "#92400E", // brown/gold
  "#B45309",
  "#78350F",
  "#14532D",
  "#164E63",
];
// const CATEGORY_COLORS = [ "#f8d7e8", "#f4cadb", "#ecb1dd", "#e8a8b4", "#f7a38d", "#eb8b8b", "#ff7f93", "#eb5a59", "#edf4d3", "#d8efb3", "#c8ea87", "#b7cd8e", "#b3ec5e", "#a6df8b", "#9fdfac", "#42c06b", "#d6f2e8", "#bbe7f2", "#c0d6fb", "#b9d0e3", "#a7d2f4", "#9db9f4", "#57d9ea", "#6c91d8", "#f8f8c9", "#eef96b", "#ffd87d", "#e2d3aa", "#efc59a", "#ebb987", "#f2c866", "#cc8640", "#e6def9", "#c9bef6", "#b2a0f2", "#d39bd8", "#aa98dd", "#9f88f4", "#7557d6", "#613ecb", ];

export const categoryModuleSchema = {
  title: "Category",
  description: "Manage parent and child categories, tag colors, and list visibility from one place.",
  menu_id: null,
  primaryKey: "category_id",
  api: {
    list: "/categories",
    delete: "/categories/delete",
    create: "/categories/create",
    edit: "/categories",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },
  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "category",
  },
  staticJoined: [],
  tableCellConfig: [
    { column_name: "categoryName", type: "person" },
    { column_name: "slug", type: "clip" },
    { column_name: "parent_id", type: "tag" },
    { column_name: "cat_color", type: "tag", color_field: "cat_color" },
    { column_name: "status", type: "badge" },
    { column_name: "", type: "badge", color_field: "status_color" },
  ],
  defaultColumns: ["categoryName", "slug", "parent_id", "cat_color", "status"],
  skipFields: [],
  columnMappings: [
    { categoryName: "Category Name" },
    { parent_id: "Parent Category" },
    { cat_color: "Tag Color" },
  ],
  savedFilters: [],
  form: {
    initialValues: {
      category_id: null,
      categoryName: null,
      slug: null,
      is_parent: "no",
      parent_id: null,
      cat_color: null,
      description: null,
      status: "active",
      is_sys_category: "no",
    },
    sections: [
      {
        columns: 3,
        fields: [
          {
            name: "categoryName",
            label: "Category Name",
            type: "text",
            required: true,
            placeholder: "Enter category name",
            gridSpan: 4,
            readOnlyWhen: (values) => values.is_sys_category === "yes",
          },
          {
            name: "slug",
            label: "Slug",
            type: "text",
            required: true,
            placeholder: "enter-category-slug",
            gridSpan: 4,
            readOnlyWhen: (values) => values.is_sys_category === "yes",
          },
          {
            name: "is_parent",
            label: "Is A Parent Category",
            type: "radio",
            gridSpan: 4,
            readOnlyWhen: (values) => values.is_sys_category === "yes",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "parent_id",
            label: "Select Parent Category",
            type: "smartSelectInput",
            id: "parent_id",
            required: true,
            visibleWhen: (values) => values.is_parent === "no",
            readOnlyWhen: (values) => values.is_sys_category === "yes",
            config: {
              apiUrl: "/system/searchList",
              type: "parent-category",
              source: "categories",
              list: "category_id,categoryName",
              check: "categoryName",
              preload: true,
              labelKey: "categoryName",
              valueKey: "category_id",
              placeholder: "Select Parent Category",
              multi: false,
            },
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "cat_color",
            label: "Tag Color",
            type: "colorSwatches",
            required: false,
            gridSpan: 12,
            options: CATEGORY_COLORS,
            // readOnlyWhen: (values) => values.is_sys_category === "yes",
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "description",
            label: "Description",
            type: "editor",
            rows: 4,
            required: false,
            placeholder: "Enter category description",
            gridSpan: 12,
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "status",
            label: "Status",
            type: "radio",
            gridSpan: 12,
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ],
      },
    ],
  },
  validationSchema: z.object({
    categoryName: z.preprocess( (value) => value ?? "", z.string().trim().min(1, "Category name is required") ),
    slug: z.string().trim().min(1, "Slug is required"),
    is_parent: z.enum(["yes", "no"]),
    parent_id: z.any().optional(),
    cat_color: z.string().nullable().optional(),
    description: z.string().nullish(),
    status: z.enum(["active", "inactive"]),
  }).superRefine((data, ctx) => {
    if (data.is_parent === "no" && !data.parent_id) {
      ctx.addIssue({
        code: "custom",
        path: ["parent_id"],
        message: "Parent category is required",
      });
    }
  }),
};

export const categoryFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(categoryModuleSchema.defaultColumns, {
    columnMappings: categoryModuleSchema.columnMappings,
    tableCellConfig: categoryModuleSchema.tableCellConfig,
  }),
];
