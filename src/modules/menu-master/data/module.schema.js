import { buildFallbackColumnsFromKeys } from "../../../utils/moduleStructure";
import { z } from "zod";

const FIXED_TABLE_COLUMNS = [
  { key: "select", className: "check-col", checkbox: true, width: 42, minWidth: 42, resizable: false },
];

export const menuMasterSchema = {
  title: "Menu Master",
  description: "Create and manage menus, modules, sidebar routes and dynamic system links.",
  menu_id: 3,
  primaryKey: "menu_id",
  api: {
    list: "/menus",
    delete: "/menus/changestatus",
    create: "/menus/create",
    edit: "/menus",
    definitions: "/system/getDefinations",
    definitionsFallback: "/system/getstructure",
  },

  definitionRequest: {
    menuIDField: "menu_id",
    modelNameField: "model_name",
    modelName: "menu",
  },

  staticJoined: [
    {
      field: "parentID",
      fieldtype: "joined",
      joinedTable: "menu",
      select: "menu_id,menuName",
      primaryKey: "menu_id",
      labelKey: "menuName",
      slug: "",
      options: [],
    },
  ],
  defaultColumns: [
    "menu_name",
    "module_name",
    "menu_link",
    "status",
  ],
  skipFields: [],
  tableCellConfig: [],
  columnMappings: [],
  savedFilters: [],
  form: {
    initialValues: {
      menu_id: null,
      module_name: null,
      menuName: null,
      module_desc: null,
      menuLink: null,
      table_name: null,
      label: null,
      plural_label: null,
      iconName: null,
      menuIndex: null,
      status: "active",
    },
    sections: [
      {
        columns: 3,
        fields: [
          {
            name: "module_name",
            label: "Module Name",
            type: "text",
            placeholder: "Ex: users",
            required: true,
            gridSpan: 4,
          },
          {
            name: "menu_name",
            label: "Menu Name",
            type: "text",
            placeholder: "Ex: Users",
            required: true,
            gridSpan: 4,
          },
          {
            name: "module_desc",
            label: "Description",
            type: "text",
            gridSpan: 4,
            placeholder: "Enter description",
          },
        ],
      },
      {
        columns: 3,
        fields: [
          {
            name: "table_name",
            label: "Table Name",
            type: "text",
            placeholder: "Ex: admin",
            gridSpan: 4,
          },
          {
            name: "label",
            label: "Form Label",
            type: "text",
            placeholder: "Ex: User",
            gridSpan: 4,
          },
          {
            name: "plural_label",
            label: "Plural Label",
            type: "text",
            placeholder: "Ex: Users",
            gridSpan: 4,
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            name: "menu_link",
            label: "Menu Link",
            type: "text",
            placeholder: "Ex: users",
            gridSpan: 4,
            required: true
          },
          {
            name: "status",
            label: "Status",
            type: "radio",
            gridSpan: 4,
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ],
      },

    ],
  },

  // validationSchema: z.object({
  //   module_name: z.string().min(1, "Module name is required"),
  //   menu_name: z.string().min(1, "Menu name is required"),
  //   menu_link: z.string().min(1, "Menu link is required"),
  //   table_name: z.string().min(1, "Table name is required"),
  // }),
  validationSchema: z.object({
    module_name: z.string().nullable().transform(v => v ?? "").refine(v => v.trim() !== "", { message: "Module name is required" }),
    menu_name: z.string().nullable().transform(v => v ?? "").refine(v => v.trim() !== "", { message: "Menu name is required" }),
    menu_link: z.string().nullable().transform(v => v ?? "").refine(v => v.trim() !== "", { message: "Menu link is required" }),
    table_name: z.string().nullable().transform(v => v ?? "").refine(v => v.trim() !== "", { message: "Table name is required" }),
  })
};

export const menuMasterFallbackColumns = [
  ...FIXED_TABLE_COLUMNS,
  ...buildFallbackColumnsFromKeys(
    menuMasterSchema.defaultColumns,
    {
      columnMappings:
        menuMasterSchema.columnMappings,
      tableCellConfig:
        menuMasterSchema.tableCellConfig,
    }
  ),
];
