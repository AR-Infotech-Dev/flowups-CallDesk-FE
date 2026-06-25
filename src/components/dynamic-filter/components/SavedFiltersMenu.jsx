import { Check, Globe2, SlidersHorizontal, Trash2 } from "lucide-react";
import SearchInput from "./SearchInput";

const SavedFiltersMenu = ({
    isOpen,
    selectedFilterId,
    filterName,
    savedFilterSearch,
    filteredSavedFilters,
    onToggle,
    onClear,
    onSearchChange,
    onSelect,
    onDelete,
}) => (
    <div className="relative">
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={onToggle}
                className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="Saved Filters"
            >
                <SlidersHorizontal size={13} />
                Saved
            </button>

            <button
                type="button"
                onClick={onClear}
                className="inline-flex h-7 items-center justify-center rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
                Clear
            </button>

            {selectedFilterId ? (
                <div className="inline-flex h-7 max-w-40 items-center truncate rounded border border-blue-100 bg-blue-50 px-2 text-xs font-medium text-blue-700">
                    {filterName || "Selected Filter"}
                </div>
            ) : null}
        </div>

        {isOpen ? (
            <div className="absolute left-0 top-8 z-30 w-72 rounded border border-slate-200 bg-white shadow-lg">
                <div className="sticky top-0 border-b border-slate-100 bg-white p-1.5">
                    <SearchInput
                        value={savedFilterSearch}
                        onChange={onSearchChange}
                        placeholder="Search filter"
                        showClear
                    />
                </div>

                <div className="max-h-60 overflow-y-auto p-1">
                    {filteredSavedFilters.length ? (
                        filteredSavedFilters.map((filter) => (
                            <div
                                key={filter.filter_id}
                                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                            >
                                <div className="flex w-5 justify-center text-slate-500">
                                    {filter.visibility === "public" ? <Globe2 size={13} /> : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onSelect?.(filter)}
                                    className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700"
                                >
                                    {filter.filter_name}
                                </button>

                                {filter.is_default === "yes" ? <Check size={14} className="text-blue-600" /> : null}

                                <button
                                    type="button"
                                    onClick={() => onDelete?.(filter)}
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 size={13} />
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
);

export default SavedFiltersMenu;
