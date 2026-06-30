import { makeRequest } from "@api/httpClient";

const getRowsFromPath = (source, path = []) =>
    path.reduce((current, key) => current?.[key], source);

const normalizeOptions = (rows = [], { labelKey = "label", valueKey = "value" } = {}) =>
    rows
        .map((row) => ({
            label: row?.[labelKey],
            value: row?.[valueKey],
            original: row,
        }))
        .filter((option) => option.label !== undefined && option.value !== undefined);

export const fetchFilterOptions = async (source = {}) => {
    if (!source.apiUrl) return [];

    const response = await makeRequest(source.apiUrl, {
        method: source.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: source.body || {},
    });

    const rows = getRowsFromPath(response, source.rowsPath || ["data"]) || [];
    return normalizeOptions(Array.isArray(rows) ? rows : [], source);
};
