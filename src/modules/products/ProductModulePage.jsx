import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";

import { makeRequest } from "../../api/httpClient";
import { useModuleFilters } from "../../store/hooks";
import { defaultSortConfig, getNextSortConfig } from "../../utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions,
} from "../../utils/moduleStructure";

import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";

import DynamicFilter from "../../components/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import useMenuPermissions from "../../auth/useMenuPermissions";

import ProductForm from "./components/ProductForm";
import { productsFallbackColumns, productsModuleSchema } from "./data/module.schema";

function ProductModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || productsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);

  const [fields, setFields] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "products",
    productList
  );

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: productsModuleSchema.skipFields,
    columnMappings: productsModuleSchema.columnMappings,
    tableCellConfig: productsModuleSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, productsFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => productsFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        productsModuleSchema.defaultColumns.map((key) => ({
          label: productsFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getProductList = async () => {
    setLoading(true);

    const res = await makeRequest(productsModuleSchema.api.list, {
      method: "POST",
      body: {
        status: "active",
        page,
        searchText: filterState.searchText,
        filters: filterState.filters,
        order: filterState.order,
        order_by: filterState.order_by,
      },
    });

    setLoading(false);

    if (res.success) {
      setProductList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }

    toast.error(res?.message || "Error while fetching products");
  };

  const getColumnList = async () => {
    if (!resolvedMenuID) {
      setFields([]);
      return;
    }

    const res = await getDefinitions(resolvedMenuID);
    if (res?.success) {
      setFields(res.data || []);
    }
  };

  const handleToggleRow = (rowId, checked) => {
    setSelectedRowIds((current) =>
      checked ? [...new Set([...current, rowId])] : current.filter((item) => item !== rowId)
    );
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(productList.map((row) => row?.product_id ?? row?.id).filter(Boolean));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one product.");
      return;
    }

    setDeleting(true);

    const res = await makeRequest(productsModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: selectedRowIds,
      },
    });

    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Products deleted successfully.");
      await getProductList();
      return;
    }

    toast.error(res?.message || "Error while deleting products");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?.product_id ?? row?.id;
    if (!rowId) {
      toast.error("Product id not found.");
      return;
    }

    if (!window.confirm("Delete this product?")) return;

    setDeleting(true);
    const res = await makeRequest(productsModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: [rowId],
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Product deleted successfully.");
      await getProductList();
      return;
    }

    toast.error(res?.message || "Error while deleting product");
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getProductList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
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
                onSaveFilter={() => {}}
                onDeleteFilter={() => {}}
                onSelectSavedFilter={() => {}}
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
                setPage(1);
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
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={setPage} />}
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
