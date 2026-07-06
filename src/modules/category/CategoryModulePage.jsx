import { useEffect, useState } from "react";
import { useAppSelector, useModuleFilters } from "@store/hooks";
import { getNextSortConfig } from "@utils/sorting";
import DynamicFilter from "@components/dynamic-filter";
import ResizableTable from "@components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import CategoryForm from "./components/CategoryForm";
import CategoryTableRow from "./components/CategoryTableRow";
import { categoryModuleSchema } from "./data/module.schema";
import { selectCategoriesRows } from "./data/categories.slice";
import { useCategoriesModule } from "./hooks/useCategoriesModule";
import { useCategoriesTableConfig } from "./hooks/useCategoriesTableConfig";

function CategoryModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || categoryModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const categoryList = useAppSelector(selectCategoriesRows);
  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("category", categoryList);

  const {
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    handlePageChange,
    getCategoryList,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
  } = useCategoriesModule({ filterState });

  const {
    sortConfig,
    resolvedColumns,
    defaultVisibleColumnKeys,
    resolvedFilterFields,
  } = useCategoriesTableConfig({ resolvedMenuID, filterState });

  const handleSortChange = (columnKey) => {
    const nextSort = getNextSortConfig(sortConfig, columnKey);
    if (page !== 1) {
      handlePageChange(1);
    }
    setSort({
      order_by: nextSort.key,
      order: nextSort.direction.toUpperCase(),
    });
  };

  useEffect(() => {
    getCategoryList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={categoryModuleSchema.title}
        description={categoryModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getCategoryList}
            onCreate={() => {
              setSelectedCategory(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length > 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleting={deleting}
            createLabel="Add Category"
            filter={
              <DynamicFilter
                filterState={filterState}
                fields={resolvedFilterFields}
                savedFilters={categoryModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={resolvedColumns}
            rows={categoryList}
            storageKey="category-module-column-widths"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            editRow={permissions.canEdit ? (category) => {
              setSelectedCategory(category);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <CategoryTableRow
                row={row}
                index={index}
                columns={columns}
                table={table}
              />
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      />

      <CategoryForm
        isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedCategory(null);
        }}
        selectedCategory={selectedCategory}
        onAfterSave={getCategoryList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default CategoryModulePage;
