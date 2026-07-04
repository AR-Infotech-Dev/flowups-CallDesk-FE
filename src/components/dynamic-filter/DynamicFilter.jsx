import FieldPicker from "./components/FieldPicker";
import FilterChip from "./components/FilterChip";
import SavedFiltersMenu from "./components/SavedFiltersMenu";
import SearchInput from "./components/SearchInput";
import useDynamicFilter from "./hooks/useDynamicFilter";

const DynamicFilter = ({
    fields = [],
    defaultFilters = [],
    savedFilters = [],
    onSearch,
    onApplyFilters,
    onSaveFilter,
    onDeleteFilter,
    onSelectSavedFilter,
    onClearFilters,
    onlySearchText = false,
}) => {
    const {
        searchText,
        fieldSearch,
        savedFilterSearch,
        selectedFilterId,
        filterName,
        showFieldMenu,
        showSavedFilterMenu,
        editingFieldKey,
        activeFilters,
        hasAppliedFilters,
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
        addField,
        updateFilter,
        removeFilter,
        handleSearchChange,
        handleSelectSavedFilter,
    } = useDynamicFilter({
        fields,
        defaultFilters,
        savedFilters,
        onSearch,
        onApplyFilters,
        onSaveFilter,
        onSelectSavedFilter,
        onClearFilters,
    });
    return (
        <div ref={filterRootRef} className="dynamic-filter-root flex w-full flex-wrap items-center gap-1.5 text-xs">
            <SearchInput
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="dynamic-filter-search w-48"
            />

            {onlySearchText ? (
                <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-7 items-center justify-center rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                    Clear
                </button>
            ) : (
                <>
                    {/* <SavedFiltersMenu
                        isOpen={showSavedFilterMenu}
                        selectedFilterId={selectedFilterId}
                        filterName={filterName}
                        savedFilterSearch={savedFilterSearch}
                        filteredSavedFilters={filteredSavedFilters}
                        onToggle={() => setShowSavedFilterMenu((prev) => !prev)}
                        onClear={clearFilters}
                        onSearchChange={setSavedFilterSearch}
                        onSelect={handleSelectSavedFilter}
                        onDelete={onDeleteFilter}
                    /> */}

                    <FieldPicker
                        isOpen={showFieldMenu}
                        fieldSearch={fieldSearch}
                        filteredFields={filteredFields}
                        onToggle={() => setShowFieldMenu((prev) => !prev)}
                        onSearchChange={setFieldSearch}
                        onAddField={addField}
                    />

                    {(searchText || activeFilters.length || hasAppliedFilters) ? (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-7 items-center justify-center rounded border! border-slate-200! bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    ) : null}

                    {activeFilters.map((item) => (
                        <FilterChip
                            key={item.id}
                            item={item}
                            isEditing={editingFieldKey === item.id}
                            onToggleEdit={() =>
                                setEditingFieldKey(editingFieldKey === item.id ? null : item.id)
                            }
                            onRemove={() => removeFilter(item.id)}
                            onUpdate={(key, value) => updateFilter(item.id, key, value)}
                            onCancel={() => setEditingFieldKey(null)}
                            onApply={() => {
                                setEditingFieldKey(null);
                                applyFilters();
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default DynamicFilter;
