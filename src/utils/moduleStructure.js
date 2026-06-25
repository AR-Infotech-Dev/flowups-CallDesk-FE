import { makeRequest } from "../api/httpClient";

function titleCaseFromKey(key = "") {
  return String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeKey(value = "") {
  return String(value).replace(/\s+/g, "").replace(/_/g, "").toLowerCase();
}

function buildLabelMap(columnMappings = []) {
  return columnMappings.reduce((accumulator, item) => {
    const [key, label] = Object.entries(item || {})[0] || [];
    if (key && label) {
      accumulator[normalizeKey(key)] = label;
    }
    return accumulator;
  }, {});
}

function normalizeCellDisplayConfig(config = {}) {
  const key =
    config.key ||
    config.column_name ||
    config.columnName ||
    config.field ||
    "";

  const type = String(config.type || "text").trim();

  const colorField =
    config.colorField ||
    config.color_field ||
    config.color_key ||
    "";

  return {
    key: String(key).trim(),
    type,
    colorField: String(colorField || "").trim(),
    width: config.width,
    minWidth: config.minWidth || config.min_width,
  };
}

function buildCellDisplayMap(configs = []) {
  return configs.reduce((accumulator, config) => {
    const normalized = normalizeCellDisplayConfig(config);

    if (normalized.key) {
      accumulator[normalizeKey(normalized.key)] = normalized;
    }

    return accumulator;
  }, {});
}

function inferCellType(fieldKey, fieldType, cellDisplayMap = {}) {
  const normalizedKey = String(fieldKey || "").toLowerCase();
  const normalizedType = String(fieldType || "").toLowerCase();
  const matched = cellDisplayMap[normalizeKey(fieldKey)];

  if (matched?.type) {
    return {
      type: matched.type,
      colorField: matched.colorField || "",
    };
  }

  if (normalizedKey.includes("status")) {
    return { type: "status", colorField: "" };
  }

  if (normalizedKey.includes("name")) {
    return { type: "person", colorField: "" };
  }

  if (normalizedKey.includes("email") || normalizedKey.includes("link")) {
    return { type: "clip", colorField: "" };
  }

  if (
    normalizedKey.includes("role") ||
    normalizedKey.includes("type")
  ) {
    return { type: "tag", colorField: "" };
  }

  if (
    normalizedKey.includes("department") ||
    normalizedKey.includes("module")
  ) {
    return { type: "dotText", colorField: "" };
  }

  if (normalizedType === "textarea" || normalizedType === "editor") {
    return { type: "clip", colorField: "" };
  }

  return undefined;
}

function getFieldKey(field) {
  return (
    field?.Field ||
    field?.value ||
    field?.name ||
    field?.field ||
    field?.field_name ||
    field?.column_name ||
    field?.key ||
    ""
  );
}

function getFieldLabel(field, fieldKey, labelMap = {}) {
  return (
    labelMap[normalizeKey(fieldKey)] ||
    field?.label ||
    field?.lable ||
    field?.display_name ||
    field?.title ||
    titleCaseFromKey(fieldKey)
  );
}

function getFieldType(field) {
  return String(field?.Type || field?.type || field?.input_type || "text").toLowerCase();
}

export function buildFallbackColumnsFromKeys(keys = [], options = {}) {
  const labelMap = buildLabelMap(options.columnMappings);
  const cellDisplayMap = buildCellDisplayMap(
    options.tableCellConfig || options.customCelltypes || []
  );

  return keys.map((key) => {
    const cellConfig = inferCellType(
      key,
      "text",
      cellDisplayMap
    );

      return {
        key,
        label: getFieldLabel({}, key, labelMap),
        width: cellConfig?.width || 180,
        minWidth: cellConfig?.minWidth || 120,
        cellType: cellConfig?.type || 'text',
        colorField: cellConfig?.colorField || "",
      }
  }
  );
}

export function buildTableColumnsFromStructure(fields = [], fallbackColumns = [], options = {}) {
  const skipFieldSet = new Set((options.skipFields || []).map((field) => normalizeKey(field)));
  const labelMap = buildLabelMap(options.columnMappings);
  const cellDisplayMap = buildCellDisplayMap(
    options.tableCellConfig || options.customCelltypes || []
  );
  const fixedColumns = fallbackColumns.filter(
    (column) => column.checkbox || column.className === "icon-col"
  );

  const dynamicColumns = fields
    .map((field) => {
      const key = getFieldKey(field);
      if (!key || skipFieldSet.has(normalizeKey(key))) {
        return null;
      }

      const type = getFieldType(field);
      const cellConfig = inferCellType(key, type, cellDisplayMap);

      return {
        key,
        label: getFieldLabel(field, key, labelMap),
        width: cellConfig?.width || 180,
        minWidth: cellConfig?.minWidth || 120,
        cellType: cellConfig?.type || "text",
        colorField: cellConfig?.colorField || "",
      };
    })
    .filter(Boolean);

  return dynamicColumns.length ? [...fixedColumns, ...dynamicColumns] : fallbackColumns;
}

export function buildFilterFieldsFromStructure(fields = [], fallbackFields = [], options = {}) {
  const skipFieldSet = new Set((options.skipFields || []).map((field) => normalizeKey(field)));
  const labelMap = buildLabelMap(options.columnMappings);
  const normalizedFields = fields
    .map((field) => {
      const key = getFieldKey(field);
      if (!key || skipFieldSet.has(normalizeKey(key))) {
        return null;
      }

      const type = getFieldType(field);
      return {
        label: getFieldLabel(field, key, labelMap),
        value: key,
        type:
          type === "number" || type === "numeric"
            ? "number"
            : type === "date"
              ? "date"
              : "text",
      };
    })
    .filter(Boolean);

  return normalizedFields.length ? normalizedFields : fallbackFields;
}

export async function getDefinitions(menu_id) {
  const primaryResponse = await makeRequest('/system/getDefinations', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      "menu_id": menu_id,
    },
  });

  if (primaryResponse.success) {
    return primaryResponse;
  }
}
