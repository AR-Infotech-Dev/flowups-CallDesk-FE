import { Plus } from "lucide-react";
import SearchInput from "./SearchInput";

const FieldPicker = ({
    isOpen,
    fieldSearch,
    filteredFields,
    onToggle,
    onSearchChange,
    onAddField,
}) => (
    <div className="relative">
        <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-7 items-center gap-1.5 rounded bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700"
            title="Add Filter"
        >
            <Plus size={13} />
            Filter
        </button>

        {isOpen ? (
            <div className="absolute left-0 top-8 z-30 w-60 rounded border border-slate-200 bg-white py-1 shadow-lg">
                <div className="sticky top-0 border-slate-100 bg-white p-1">
                    <SearchInput
                        value={fieldSearch}
                        onChange={onSearchChange}
                        placeholder="Search field"
                    />
                </div>

                <div className="max-h-56 overflow-y-auto px-1 py-0.5">
                    {filteredFields.length ? (
                        filteredFields.map((field) => (
                            <button
                                key={field.value}
                                type="button"
                                onClick={() => onAddField?.(field)}
                                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                                <span className="truncate">{field.label}</span>
                                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none text-slate-500">
                                    {field.type || "text"}
                                </span>
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
);

export default FieldPicker;
