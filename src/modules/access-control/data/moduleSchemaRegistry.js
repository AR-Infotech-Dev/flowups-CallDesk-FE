import { categoryModuleSchema } from "../../category/data/module.schema";
import { companyMasterSchema } from "../../company-master/data/module.schema";
import { customerModuleSchema } from "../../customer/data/module.schema";
import { amcReminderModuleSchema } from "../../amc-reminders/data/module.schema";
import { menuMasterSchema } from "../../menu-master/data/module.schema";
import { productsModuleSchema } from "../../products/data/module.schema";
import { performanceReportSchema } from "../../reports/performance-report/data/module.schema";
import { ticketsModuleSchema } from "../../tickets/data/module.schema";
import { usersModuleSchema } from "../../users/data/module.schema";

const normalizeKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const schemaRegistry = [
  {
    schema: ticketsModuleSchema,
    aliases: ["tickets", "ticket", "tasks", "task"],
  },
  {
    schema: menuMasterSchema,
    aliases: ["menus", "menu", "menu-master"],
  },
  {
    schema: customerModuleSchema,
    aliases: ["customers", "customer"],
  },
  {
    schema: amcReminderModuleSchema,
    aliases: ["amc-reminders", "amc-reminder", "amc reminders"],
  },
  {
    schema: productsModuleSchema,
    aliases: ["products", "product"],
  },
  {
    schema: performanceReportSchema,
    aliases: ["reports", "report", "performance-reports", "performance-report", "reports-performance"],
  },
  {
    schema: usersModuleSchema,
    aliases: ["users", "user"],
  },
  {
    schema: categoryModuleSchema,
    aliases: ["categories", "category"],
  },
  {
    schema: companyMasterSchema,
    aliases: ["companies", "company", "company-master", "companymaster"],
  },
];

const getSchemaFieldRows = (schema = {}) => {
  const formFields = (schema.form?.sections || []).flatMap((section) => section.fields || []);
  const fallbackFields = schema.defaultColumns || [];

  if (formFields.length) {
    return formFields.map((field) => ({
      field_id: field.field_id || field.name,
      field_name: field.name,
      label: field.label || field.name,
    }));
  }

  return fallbackFields.map((fieldName) => ({
    field_id: fieldName,
    field_name: fieldName,
    label: fieldName,
  }));
};

export const getSchemaFieldsForMenu = (menu = {}) => {
  const matchKeys = [
    menu.menu_link,
    menu.menuLink,
    menu.path,
    menu.module_name,
    menu.moduleName,
    menu.table_name,
    menu.tableName,
    menu.name,
  ].map(normalizeKey);

  const matched = schemaRegistry.find(({ schema, aliases }) => {
    const schemaKeys = [
      schema.title,
      schema.definitionRequest?.modelName,
      schema.api?.list,
      ...aliases,
    ].map(normalizeKey);

    return matchKeys.some((key) => key && schemaKeys.includes(key));
  });

  return matched ? getSchemaFieldRows(matched.schema) : [];
};
