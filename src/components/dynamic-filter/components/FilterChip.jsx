import { Filter, X } from "lucide-react";
import {
    getConditionsByType,
    getDateRangeValue,
    getFilterChipSummary,
    getValueInputType,
    isDateRangeCondition,
    shouldShowValueInput,
} from "../utils/filterUtils";
import SearchableSelect from "./SearchableSelect";

const FilterChip = ({
    item,
    isEditing,
    onToggleEdit,
    onRemove,
    onUpdate,
    onCancel,
    onApply,
}) => {
    const hasOptions = Array.isArray(item.options) && item.options.length > 0;
    const chipSummary = getFilterChipSummary(item);

    return (
    <div className="relative">
        <div className="inline-flex h-7 items-center gap-1.5 rounded border border-blue-100 bg-blue-50 px-2 text-xs">
            <button
                type="button"
                onClick={onToggleEdit}
                className="flex min-w-0 items-center gap-1.5 text-blue-800"
            >
                <Filter size={11} />
                <span className="font-semibold leading-none">{item.label}</span>
                {chipSummary ? (
                    <span className="max-w-44 truncate border-l border-blue-200 pl-1.5 leading-none text-blue-600">
                        {chipSummary}
                    </span>
                ) : null}
            </button>

            {!item.isDefault ? (
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-blue-400 hover:text-blue-700"
                >
                    <X size={12} />
                </button>
            ) : null}
        </div>

        {isEditing ? (
            <div className="absolute left-0 top-8 z-30 w-60 rounded border border-slate-200 bg-white p-2.5 shadow-lg">
                <div className="mb-2">
                    <div className="mb-1 text-xs font-semibold text-slate-700">
                        {item.label}
                    </div>

                    <select
                        value={item.condition}
                        onChange={(e) => onUpdate?.("condition", e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
                    >
                        <option value="">Select condition</option>
                        {getConditionsByType(item.type).map((condition) => (
                            <option key={condition.value} value={condition.value}>
                                {condition.label}
                            </option>
                        ))}
                    </select>
                </div>

                {isDateRangeCondition(item.condition) ? (
                    <div className="mb-2.5 grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={getDateRangeValue(item.value).from_date}
                                onChange={(e) =>
                                    onUpdate?.("value", {
                                        ...getDateRangeValue(item.value),
                                        from_date: e.target.value,
                                    })
                                }
                                className="h-7 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={getDateRangeValue(item.value).to_date}
                                onChange={(e) =>
                                    onUpdate?.("value", {
                                        ...getDateRangeValue(item.value),
                                        to_date: e.target.value,
                                    })
                                }
                                className="h-7 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                ) : shouldShowValueInput(item.condition) && hasOptions ? (
                    <div className="mb-2.5">
                        <SearchableSelect
                            value={item.value}
                            options={item.options}
                            placeholder={`Select ${item.label}`}
                            onChange={(value) => onUpdate?.("value", value)}
                        />
                    </div>
                ) : shouldShowValueInput(item.condition) ? (
                    <div className="mb-2.5">
                        <input
                            type={getValueInputType(item.type)}
                            value={item.value}
                            onChange={(e) => onUpdate?.("value", e.target.value)}
                            placeholder={`Enter ${item.label}`}
                            className="h-7 w-full rounded border border-slate-200 px-2 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
                        />
                    </div>
                ) : null}

                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-7 rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onApply}
                        className="h-7 rounded bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            </div>
        ) : null}
    </div>
    );
};

export default FilterChip;
