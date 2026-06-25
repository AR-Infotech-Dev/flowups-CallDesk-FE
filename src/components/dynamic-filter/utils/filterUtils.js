import {
    DATE_CONDITIONS,
    DEFAULT_CONDITION_BY_TYPE,
    EMPTY_VALUE_CONDITIONS,
    SELECT_CONDITIONS,
    TEXT_CONDITIONS,
    VALUELESS_DATE_CONDITIONS,
} from "./filterConstants";

export const getDefaultCondition = (type = "text") =>
    DEFAULT_CONDITION_BY_TYPE[type] || DEFAULT_CONDITION_BY_TYPE.text;

export const getConditionsByType = (type = "text") =>
    type === "date"
        ? DATE_CONDITIONS
        : ["select", "enum"].includes(type)
            ? SELECT_CONDITIONS
            : TEXT_CONDITIONS;

export const isConditionValidForType = (type = "text", conditionValue = "") => {
    if (!conditionValue) return true;
    return getConditionsByType(type).some((condition) => condition.value === conditionValue);
};

export const shouldShowValueInput = (condition) =>
    Boolean(condition) &&
    !EMPTY_VALUE_CONDITIONS.includes(condition) &&
    !VALUELESS_DATE_CONDITIONS.includes(condition) &&
    condition !== "date_range";

export const isDateRangeCondition = (condition) => condition === "date_range";

export const getEmptyValueByCondition = (condition) =>
    isDateRangeCondition(condition) ? { from_date: "", to_date: "" } : "";

export const getDateRangeValue = (value) => ({
    from_date: value?.from_date || "",
    to_date: value?.to_date || "",
});

export const getConditionLabel = (type = "text", conditionValue = "") =>
    getConditionsByType(type).find((condition) => condition.value === conditionValue)?.label ||
    conditionValue;

export const getFilterChipSummary = (item = {}) => {
    if (!item.condition) return "";

    const conditionLabel = getConditionLabel(item.type, item.condition);

    if (isDateRangeCondition(item.condition)) {
        const { from_date, to_date } = getDateRangeValue(item.value);
        const rangeText = [from_date, to_date].filter(Boolean).join(" - ");
        return rangeText ? `${conditionLabel}: ${rangeText}` : conditionLabel;
    }

    if (!shouldShowValueInput(item.condition)) {
        return conditionLabel;
    }

    const selectedOption = Array.isArray(item.options)
        ? item.options.find((option) => String(option.value) === String(item.value))
        : null;
    const value = String(selectedOption?.label || item.value || "").trim();
    return value ? `${conditionLabel}: ${value}` : conditionLabel;
};

export const hasFilterValue = (item = {}) => {
    if (!item.condition) return false;
    if (EMPTY_VALUE_CONDITIONS.includes(item.condition)) return true;
    if (VALUELESS_DATE_CONDITIONS.includes(item.condition)) return true;
    if (isDateRangeCondition(item.condition)) {
        const { from_date, to_date } = getDateRangeValue(item.value);
        return Boolean(from_date && to_date);
    }

    return String(item.value ?? "").trim() !== "";
};

export const getValueInputType = (type = "text") => {
    if (type === "number") return "number";
    if (type === "date") return "date";
    return "text";
};

export const filterFieldsBySearch = (fields = [], searchText = "") => {
    const normalizedSearch = searchText.toLowerCase();
    return fields.filter((field) =>
        String(field.label || "").toLowerCase().includes(normalizedSearch)
    );
};

export const filterSavedFiltersBySearch = (savedFilters = [], searchText = "") => {
    const normalizedSearch = searchText.toLowerCase();
    return savedFilters.filter((filter) =>
        String(filter.filter_name || "").toLowerCase().includes(normalizedSearch)
    );
};

export const buildAppliedFilterPayload = (activeFilters = []) =>
    activeFilters
        .filter(hasFilterValue)
        .map((item) => ({
            field: item.field,
            condition: item.condition,
            value: item.value,
            type: item.type,
        }));

export const buildSavedFilterPayload = ({
    selectedFilterId,
    filterName,
    visibility,
    activeFilters,
}) => ({
    filter_id: selectedFilterId || null,
    filter_name: filterName,
    visibility,
    conditions: activeFilters.map((item) => ({
        field: item.field,
        label: item.label,
        type: item.type,
        condition: item.condition,
        value: item.value,
    })),
});
