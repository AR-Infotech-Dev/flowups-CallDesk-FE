import { accessModules } from "../data/accessControlData";

export const buildDefaultModules = (rows = accessModules) =>
  rows.map((module) => ({
    ...module,
    permissions: { view: false, add: false, edit: false, delete: false },
    fields: module.fields.map((field) => ({ ...field, visible: false, editable: false })),
  }));

export const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
};

export const parseMaybeJson = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const getModulePermissionKey = (module = {}) => String(module.menu_id || module.id);

export const getFieldId = (field = {}) =>
  field?.field_id || field?.fieldID || field?.id || field?._id || field?.Field || field?.field_name || field?.key || field?.name;

export const getFieldName = (field = {}) => field?.name || "";

export const getFieldLabel = (field = {}) =>
  field?.label || field?.lable || field?.display_name || field?.title || getFieldName(field);

export const normalizeField = (field = {}, savedPermission = {}) => {
  const fieldId = getFieldId(field);
  const fieldName = getFieldName(field);
  const editable = toBoolean(savedPermission?.editable ?? savedPermission?.can_edit);
  const visible = toBoolean(savedPermission?.visible ?? savedPermission?.can_view ?? savedPermission?.enabled) || editable;

  return {
    key: String(fieldId || fieldName),
    field_id: fieldId,
    field_name: fieldName,
    label: getFieldLabel(field),
    visible,
    editable,
  };
};

export const normalizePermissionMap = (payload = {}) => {
  const source =
    payload?.permissions ||
    payload?.data?.permissions ||
    payload?.data ||
    payload;

  if (Array.isArray(source)) {
    return source.reduce((accumulator, item) => {
      const menuId = item?.menu_id || item?.menuID || item?.menuId || item?.id;
      if (menuId) accumulator[String(menuId)] = item;
      return accumulator;
    }, {});
  }

  if (source && typeof source === "object") {
    return source;
  }

  return {};
};

export const getFieldPermission = (permissions = [], field = {}) => {
  const normalized = Array.isArray(permissions) ? permissions : [];
  return normalized.find((item) => {
    const savedFieldId = item?.field_id || item?.fieldID || item?.id;
    const savedFieldName = item?.field_name || item?.fieldName || item?.name || item?.key;
    const currentFieldId = field.field_id || field.id;
    const currentFieldName = field.field_name || field.key || field.name;

    if (savedFieldId && currentFieldId && String(savedFieldId) === String(currentFieldId)) return true;
    if (savedFieldName && currentFieldName && String(savedFieldName) === String(currentFieldName)) return true;
    return false;
  });
};

export const applyPermissionMapToModules = (moduleRows = [], permissionMap = {}) =>
  moduleRows.map((module) => {
    const permission = permissionMap[getModulePermissionKey(module)] || permissionMap[module.id] || {};
    const fields = parseMaybeJson(permission.fields || permission.field_permissions || permission.fieldPermissions) || [];
    const view = toBoolean(permission.view ?? permission.can_view);
    const add = view && toBoolean(permission.add ?? permission.can_add);
    const edit = view && toBoolean(permission.edit ?? permission.can_edit);
    const deleteAllowed = view && toBoolean(permission.delete ?? permission.can_delete);

    return {
      ...module,
      permissions: {
        view,
        add,
        edit,
        delete: deleteAllowed,
      },
      savedFieldPermissions: fields,
      fields: module.fields.map((field) => {
        const fieldPermission = getFieldPermission(fields, field);
        return {
          ...normalizeField(field, fieldPermission),
        };
      }),
    };
  });

export const prepareFieldPermissionsJson = (module = {}) => {
  const fields = module.fields.length ? module.fields : module.savedFieldPermissions || [];

  return fields.map((field) => {
    const editable = Boolean(field.editable);
    const visible = Boolean(field.visible) || editable;

    return {
      field_id: field.field_id || field.fieldID || field.id || field.key,
      field_name: field.field_name || field.fieldName || field.name || field.key || field.label,
      visible,
      editable,
    };
  });
};

export const preparePermissionsJson = (moduleRows = []) =>
  moduleRows.reduce((accumulator, module) => {
    if (!Boolean(module.permissions.view)) return accumulator;
    accumulator[getModulePermissionKey(module)] = {
      view: Boolean(module.permissions.view),
      add: Boolean(module.permissions.add),
      edit: Boolean(module.permissions.edit),
      delete: Boolean(module.permissions.delete),
      fields: prepareFieldPermissionsJson(module),
    };
    return accumulator;
  }, {});
