import { Delete, FilterX } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";


const TEXT_CONDITIONS = [
    { label: "Is In", value: "is_in" },
    { label: "Start With", value: "start_with" },
    { label: "End With", value: "end_with" },
    { label: "Equal To", value: "equal_to" },
    { label: "Not Equal To", value: "not_equal_to" },
    { label: "Is Empty", value: "is_empty" },
    { label: "Is Not Empty", value: "is_not_empty" },
];

const EMPTY_VALUE_CONDITIONS = ["is_empty", "is_not_empty"];

const defaultConditionByType = {
    text: "is_in",
    number: "equal_to",
    date: "exact_date",
    select: "equal_to",
};

const DynamicFilter = ({
    fields = [],
    savedFilters = [],
    onSearch,
    onApplyFilters,
    onSaveFilter,
    onDeleteFilter,
    onSelectSavedFilter,
    onClearFilters,
}) => {
    const [searchText, setSearchText] = useState("");
    const [fieldSearch, setFieldSearch] = useState("");
    const [savedFilterSearch, setSavedFilterSearch] = useState("");
    const [selectedFilterId, setSelectedFilterId] = useState("");
    const [filterName, setFilterName] = useState("");
    const [visibility, setVisibility] = useState("private");
    const [showFieldMenu, setShowFieldMenu] = useState(false);
    const [showSavedFilterMenu, setShowSavedFilterMenu] = useState(false);
    const [editingFieldKey, setEditingFieldKey] = useState(null);

    const [activeFilters, setActiveFilters] = useState([]);

    const fieldMenuRef = useRef(null);
    const savedMenuRef = useRef(null);

    const filteredFields = useMemo(() => {
        return fields.filter((field) =>
            field.label.toLowerCase().includes(fieldSearch.toLowerCase())
        );
    }, [fields, fieldSearch]);

    const filteredSavedFilters = useMemo(() => {
        return savedFilters.filter((filter) =>
            filter.filter_name.toLowerCase().includes(savedFilterSearch.toLowerCase())
        );
    }, [savedFilters, savedFilterSearch]);

    const addField = (field) => {
        const alreadyExists = activeFilters.some((item) => item.field === field.value);
        if (alreadyExists) return;

        const next = {
            id: `${field.value}-${Date.now()}`,
            field: field.value,
            label: field.label,
            type: field.type || "text",
            condition: defaultConditionByType[field.type || "text"] || "is_in",
            value: "",
        };

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
                        ...(key === "condition" && EMPTY_VALUE_CONDITIONS.includes(value)
                            ? { value: "" }
                            : {}),
                    }
                    : item
            )
        );
    };

    const removeFilter = (id) => {
        setActiveFilters((prev) => prev.filter((item) => item.id !== id));
        if (editingFieldKey === id) setEditingFieldKey(null);
    };

    const applyFilters = () => {
        const payload = activeFilters.map((item) => ({
            field: item.field,
            condition: item.condition,
            value: item.value,
            type: item.type,
        }));

        onApplyFilters?.({
            freeTextSearch: searchText,
            filters: payload,
            selectedFilterId,
        });
    };

    const clearFilters = () => {
        setSearchText("");
        setSelectedFilterId("");
        setFilterName("");
        setVisibility("private");
        setActiveFilters([]);
        setEditingFieldKey(null);
        onClearFilters?.();
    };

    const saveFilter = () => {
        const payload = {
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
        };

        onSaveFilter?.(payload);
    };

    const handleSelectSavedFilter = (filter) => {
        setSelectedFilterId(filter.filter_id);
        setFilterName(filter.filter_name);
        setVisibility(filter.visibility || "private");
        setShowSavedFilterMenu(false);
        onSelectSavedFilter?.(filter);
    };

    const getConditions = (type) => {
        if (type === "date") {
            return [
                { label: "Today", value: "today" },
                { label: "Tomorrow", value: "tomorrow" },
                { label: "Yesterday", value: "yesterday" },
                { label: "Exact Date", value: "exact_date" },
                { label: "This Month", value: "this_month" },
                { label: "This Week", value: "this_week" },
                { label: "Date Range", value: "date_range" },
                { label: "Is Empty", value: "is_empty" },
                { label: "Is Not Empty", value: "is_not_empty" },
            ];
        }

        return TEXT_CONDITIONS;
    };

    return (
        <div className="flex w-full flex-wrap items-start gap-1.5 text-xs">
            <div className="min-w-44">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSearchText(value);
                        onSearch?.(value);
                    }}
                    placeholder="Search..."
                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500"
                />
            </div>

            <div className="relative" ref={savedMenuRef}>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setShowSavedFilterMenu((prev) => !prev)}
                        className="gradient-button inline-flex h-7 w-8 items-center justify-center rounded-md"
                        title="Filter View"
                    >
                        <FilterX size={14} color="#ffffff" />
                        {/* <span className="material-symbols-outlined text-[20px]">filter_alt</span> */}
                    </button>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="ghost-button inline-flex h-7 items-center justify-center rounded-md"
                    >
                        Clear
                    </button>

                    {selectedFilterId ? (
                        <div className="inline-flex h-7 max-w-40 items-center truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-600">
                            {filterName || "Selected Filter"}
                        </div>
                    ) : null}
                </div>

                {showSavedFilterMenu ? (
                    <div className="absolute left-0 top-8 z-30 w-72 rounded-md border border-slate-200 bg-white shadow-lg">
                        <div className="sticky top-0 border-b border-slate-100 bg-white p-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={savedFilterSearch}
                                    onChange={(e) => setSavedFilterSearch(e.target.value)}
                                    placeholder="Search filter"
                                    className="h-7 w-full rounded-md border border-slate-200 px-2.5 pr-8 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                                />
                                {savedFilterSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => setSavedFilterSearch("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        ✕
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-1.5">
                            {filteredSavedFilters.length ? (
                                filteredSavedFilters.map((filter) => (
                                    <div
                                        key={filter.filter_id}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                                    >
                                        <div className="w-5 text-slate-500">
                                            {filter.visibility === "public" ? "🌐" : ""}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectSavedFilter(filter)}
                                            className="flex-1 text-left text-xs text-slate-700"
                                        >
                                            {filter.filter_name}
                                        </button>

                                        <input
                                            type="radio"
                                            checked={filter.is_default === "yes"}
                                            readOnly
                                        />

                                        <button
                                            type="button"
                                            onClick={() => onDeleteFilter?.(filter)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-5 text-center text-xs text-slate-500">
                                    No Filters Available
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="relative" ref={fieldMenuRef}>
                <button
                    type="button"
                    onClick={() => setShowFieldMenu((prev) => !prev)}
                    className="ghost-button inline-flex h-7 w-10 items-center justify-center rounded-md"
                    title="Add Filter"
                >
                    add
                </button>

                {showFieldMenu ? (
                    <div className="absolute left-0 top-8 z-30 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                        <div className="sticky top-0 border-slate-100 bg-white p-1.5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={fieldSearch}
                                    onChange={(e) => setFieldSearch(e.target.value)}
                                    placeholder="Search field"
                                    className="h-7 w-full rounded-md border border-slate-200 px-2.5 pr-8 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔍
                                </span>
                            </div>
                        </div>

                        <div className="max-h-40 overflow-y-auto px-1 py-1">
                            {filteredFields.length ? (
                                filteredFields.map((field) => (
                                    <button
                                        key={field.value}
                                        type="button"
                                        onClick={() => addField(field)}
                                        className="block w-full rounded px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        {field.label}
                                    </button>
                                ))
                            ) : (
                                <div className="py-5 text-center text-xs text-slate-500">
                                    No fields available
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {activeFilters.map((item) => (
                <div key={item.id} className="relative">
                    <div className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setEditingFieldKey(editingFieldKey === item.id ? null : item.id)}
                            className="flex items-center gap-1.5 text-slate-700"
                        >
                            <span>{item.label}</span>
                            <span className="text-slate-400">∈</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => removeFilter(item.id)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>

                    {editingFieldKey === item.id ? (
                        <div className="absolute left-0 top-8 z-30 w-56 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
                            <div className="mb-2">
                                <div className="mb-1.5 text-xs font-semibold text-slate-700">
                                    {item.label}
                                </div>

                                <select
                                    value={item.condition}
                                    onChange={(e) => updateFilter(item.id, "condition", e.target.value)}
                                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500"
                                >
                                    {getConditions(item.type).map((condition) => (
                                        <option key={condition.value} value={condition.value}>
                                            {condition.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!EMPTY_VALUE_CONDITIONS.includes(item.condition) &&
                                !["today", "tomorrow", "yesterday", "this_month", "this_week"].includes(item.condition) ? (
                                <div className="mb-3">
                                    <input
                                        type={item.type === "number" ? "number" : item.type === "date" ? "date" : "text"}
                                        value={item.value}
                                        onChange={(e) => updateFilter(item.id, "value", e.target.value)}
                                        placeholder={`Enter ${item.label}`}
                                        className="h-7 w-full rounded-md border border-slate-200 px-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingFieldKey(null)}
                                    className="ghost-button h-7"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingFieldKey(null);
                                        applyFilters();
                                    }}
                                    className="gradient-button h-7"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            ))}

            {/* {activeFilters.length > 0 ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="h-7.5 rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Apply Filters
                    </button>

                    <div className="relative">
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                            <input
                                type="text"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                placeholder="Filter Name"
                                className="w-[140px] border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />

                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === "public"}
                                    onChange={() => setVisibility("public")}
                                />
                                Public
                            </label>

                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === "private"}
                                    onChange={() => setVisibility("private")}
                                />
                                Private
                            </label>

                            <button
                                type="button"
                                onClick={saveFilter}
                                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                            >
                                Save Filter
                            </button>
                        </div>
                    </div>
                </div>
            ) : null} */}
        </div>
    );
};

export default DynamicFilter;
