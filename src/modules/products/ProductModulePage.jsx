import { useEffect,useState } from "react";

import { useAppSelector, useModuleFilters } from "../../store/hooks";
import { getNextSortConfig } from "../../utils/sorting";

import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";

import DynamicFilter from "../../components/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import { selectProductsRows } from "./data/products.slice";

import ProductForm from "./components/ProductForm";
import ProductTableRow from "./components/ProductTableRow";
import { productsModuleSchema } from "./data/module.schema";
import { useProductsModule } from "./hooks/useProductsModule";
import { useProductsTableConfig } from "./hooks/useProductsTableConfig";

function ProductModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || productsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  

  const productList = useAppSelector(selectProductsRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "products",
    productList
  );
  const {
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    handlePageChange,
    getProductList,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
  } = useProductsModule({ filterState });
  const {
    sortConfig,
    resolvedColumns,
    defaultVisibleColumnKeys,
    resolvedFilterFields,
  } = useProductsTableConfig({ resolvedMenuID, filterState });

  useEffect(() => {
    getProductList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={productsModuleSchema.title}
        description={productsModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getProductList}
            onCreate={() => {
              setSelectedProduct(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length > 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleting={deleting}
            createLabel="Add Product"
            filter={
              <DynamicFilter
                fields={resolvedFilterFields}
                savedFilters={productsModuleSchema.savedFilters}
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
            rows={productList}
            storageKey="products-module-column-widths"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            sortConfig={sortConfig}
            onSortChange={(columnKey) => {
              const nextSort = getNextSortConfig(sortConfig, columnKey);
              if (page !== 1) {
                handlePageChange(1);
              }
              setSort({
                order_by: nextSort.key,
                order: nextSort.direction.toUpperCase(),
              });
            }}
            editRow={permissions.canEdit ? (product) => {
              setSelectedProduct(product);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <ProductTableRow
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

      <ProductForm
        isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedProduct(null);
        }}
        selectedProduct={selectedProduct}
        onAfterSave={getProductList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default ProductModulePage;
