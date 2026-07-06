import { useEffect, useMemo, useRef, useState } from "react";
import { fetchFilterOptions } from "../services/filterOptions.service";
import {
    buildAppliedFilterPayload,
    buildSavedFilterPayload,
    filterFieldsBySearch,
    filterSavedFiltersBySearch,
    getEmptyValueByCondition,
    getDefaultCondition,
    hasFilterValue,
    isConditionValidForType,
} from "../utils/filterUtils";

const useDynamicFilter = ({
    filterState={},
    fields = [],
    defaultFilters = [],
    savedFilters = [],
    onSearch,
    onApplyFilters,
    onSaveFilter,
    onSelectSavedFilter,
    onClearFilters,
}) => {    
    const [searchText, setSearchText] = useState(filterState.searchText);
    const [fieldSearch, setFieldSearch] = useState("");
    const [savedFilterSearch, setSavedFilterSearch] = useState("");
    const [selectedFilterId, setSelectedFilterId] = useState("");
    const [filterName, setFilterName] = useState("");
    const [visibility, setVisibility] = useState("private");
    const [showFieldMenu, setShowFieldMenu] = useState(false);
    const [showSavedFilterMenu, setShowSavedFilterMenu] = useState(false);
    const [editingFieldKey, setEditingFieldKey] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);
    const [fieldOptionMap, setFieldOptionMap] = useState({});

    const filterRootRef = useRef(null);
    const autoAppliedDefaultKeyRef = useRef("");

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (filterRootRef.current?.contains(event.target)) return;

            setShowFieldMenu(false);
            setShowSavedFilterMenu(false);
            setEditingFieldKey(null);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const filteredFields = useMemo(
        () =>
            filterFieldsBySearch(fields, fieldSearch).map((field) => ({
                ...field,
                options: fieldOptionMap[field.value] || field.options,
            })),
        [fields, fieldSearch, fieldOptionMap]
    );

    const filteredSavedFilters = useMemo(
        () => filterSavedFiltersBySearch(savedFilters, savedFilterSearch),
        [savedFilters, savedFilterSearch]
    );

    const resolvedFieldMap = useMemo(
        () =>
            new Map(
                fields.map((field) => [
                    field.value,
                    {
                        ...field,
                        options: fieldOptionMap[field.value] || field.options || [],
                    },
                ])
            ),
        [fields, fieldOptionMap]
    );
    const defaultFilterKey = useMemo(
        () =>
            JSON.stringify(
                defaultFilters.map((filter) => ({
                    field: filter?.field || "",
                    condition: filter?.condition || "",
                    value: filter?.value ?? "",
                }))
            ),
        [defaultFilters]
    );

    const buildFilterItem = (filter, fallbackField = {}) => {
        const field = fallbackField.value ? fallbackField : resolvedFieldMap.get(filter.field);
        const fieldType = filter.type || field?.type || "text";
        const condition = filter.condition ?? (filter.isDefault ? "" : getDefaultCondition(fieldType));

        return {
            id: filter.id || `${filter.field}-${filter.isDefault ? "default" : Date.now()}`,
            field: filter.field,
            label: filter.label || field?.label || filter.field,
            type: fieldType,
            options: filter.options || field?.options || [],
            condition,
            value: filter.value ?? getEmptyValueByCondition(condition),
            isDefault: Boolean(filter.isDefault),
        };
    };

    const applyFilters = (filters = activeFilters) => {
        onApplyFilters?.({
            searchText,
            filters: buildAppliedFilterPayload(filters),
            selectedFilterId,
        });
    };

    const clearFilters = () => {
        const resetDefaultFilters = activeFilters
            .filter((item) => item.isDefault)
            .map((item) =>
                buildFilterItem({
                    ...item,
                    value: "",
                    condition: "",
                    isDefault: true,
                })
            );

        setSearchText("");
        setSelectedFilterId("");
        setFilterName("");
        setVisibility("private");
        setActiveFilters(resetDefaultFilters);
        setEditingFieldKey(null);
        setShowFieldMenu(false);
        setShowSavedFilterMenu(false);
        onClearFilters?.();
    };

    const saveFilter = () => {
        onSaveFilter?.(
            buildSavedFilterPayload({
                selectedFilterId,
                filterName,
                visibility,
                activeFilters,
            })
        );
    };

    const addField = (field) => {
        const alreadyExists = activeFilters.some((item) => item.field === field.value);
        if (alreadyExists) return;

        const next = buildFilterItem({
            id: `${field.value}-${Date.now()}`,
            field: field.value,
        }, field);

        setActiveFilters((prev) => [...prev, next]);
        setEditingFieldKey(next.id);
        setShowFieldMenu(false);
    };

    const updateFilter = (id, key, value) => {
        setActiveFilters((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [key]: value,
                        ...(key === "condition"
                            ? { value: getEmptyValueByCondition(value) }
                            : {}),
                    }
                    : item
            )
        );
    };

    const removeFilter = (id) => {
        const target = activeFilters.find((item) => item.id === id);
        if (target?.isDefault) return;

        const nextFilters = activeFilters.filter((item) => item.id !== id);
        setActiveFilters(nextFilters);
        applyFilters(nextFilters);
        if (editingFieldKey === id) setEditingFieldKey(null);
    };

    const handleSearchChange = (value) => {
        setSearchText(value);
        onSearch?.(value);
    };

    const handleSelectSavedFilter = (filter) => {
        setSelectedFilterId(filter.filter_id);
        setFilterName(filter.filter_name);
        setVisibility(filter.visibility || "private");
        setShowSavedFilterMenu(false);
        onSelectSavedFilter?.(filter);
    };

    useEffect(() => {
        let isMounted = true;
        const fieldsWithRemoteOptions = fields.filter(
            (field) => field?.value && field?.optionsSource
        );

        if (!fieldsWithRemoteOptions.length) return;

        const loadOptions = async () => {
            const loadedEntries = await Promise.all(
                fieldsWithRemoteOptions.map(async (field) => [
                    field.value,
                    await fetchFilterOptions(field.optionsSource),
                ])
            );

            if (!isMounted) return;
            setFieldOptionMap((current) => ({
                ...current,
                ...Object.fromEntries(loadedEntries),
            }));
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, [fields]);

    useEffect(() => {
        if (!fields.length) return;
        setActiveFilters((current) =>
            current.map((item) => {
                const latestField = resolvedFieldMap.get(item.field);
                if (!latestField) return item;

                const latestType = latestField.type || item.type;
                const isConditionValid = isConditionValidForType(latestType, item.condition);

                return {
                    ...item,
                    label: latestField.label || item.label,
                    type: latestType,
                    options: latestField.options || item.options || [],
                    condition: isConditionValid ? item.condition : "",
                    value: isConditionValid ? item.value : "",
                };
            })
        );
    }, [fields, fieldOptionMap, resolvedFieldMap]);

    useEffect(() => {
        if (!fields.length) return;

        const allowedDefaultFields = new Set(
            defaultFilters.map((filter) => filter?.field).filter(Boolean)
        );

        setActiveFilters((current) => {
            const retainedFilters = current.filter(
                (item) => !item.isDefault || allowedDefaultFields.has(item.field)
            );
            const existingFieldSet = new Set(retainedFilters.map((item) => item.field));
            const nextDefaultFilters = defaultFilters
                .filter((filter) => filter?.field && !existingFieldSet.has(filter.field))
                .map((filter) => buildFilterItem({ ...filter, isDefault: true }));

            return [...nextDefaultFilters, ...retainedFilters];
        });
    }, [defaultFilterKey, fields.length]);

    useEffect(() => {
        if (!defaultFilters.length || autoAppliedDefaultKeyRef.current === defaultFilterKey) return;

        const hasApplicableDefaultFilter = activeFilters.some(
            (item) => item.isDefault && hasFilterValue(item)
        );

        if (!hasApplicableDefaultFilter) return;



        autoAppliedDefaultKeyRef.current = defaultFilterKey;
        onApplyFilters?.({
            searchText,
            filters: buildAppliedFilterPayload(activeFilters),
            selectedFilterId,
        });
    }, [activeFilters, defaultFilters.length, defaultFilterKey, onApplyFilters, searchText, selectedFilterId]);

    return {
        searchText,
        fieldSearch,
        savedFilterSearch,
        selectedFilterId,
        filterName,
        showFieldMenu,
        showSavedFilterMenu,
        editingFieldKey,
        activeFilters,
        hasAppliedFilters: activeFilters.some(hasFilterValue),
        filteredFields,
        filteredSavedFilters,
        filterRootRef,
        setFieldSearch,
        setSavedFilterSearch,
        setShowFieldMenu,
        setShowSavedFilterMenu,
        setEditingFieldKey,
        applyFilters,
        clearFilters,
        saveFilter,
        addField,
        updateFilter,
        removeFilter,
        handleSearchChange,
        handleSelectSavedFilter,
    };
};

export default useDynamicFilter;
