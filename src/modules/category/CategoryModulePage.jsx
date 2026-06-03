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

import CategoryForm from "./components/CategoryForm";
import { categoryFallbackColumns, categoryModuleSchema } from "./data/module.schema";

function CategoryModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || categoryModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);

  const [fields, setFields] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "category",
    categoryList
  );

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: categoryModuleSchema.skipFields,
    columnMappings: categoryModuleSchema.columnMappings,
    tableCellConfig: categoryModuleSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, categoryFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => categoryFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        categoryModuleSchema.defaultColumns.map((key) => ({
          label: categoryFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getCategoryList = async () => {
    setLoading(true);

    const res = await makeRequest(categoryModuleSchema.api.list, {
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
      setCategoryList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }

    toast.error(res?.message || "Error while fetching categories");
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

    setSelectedRowIds(categoryList.map((row) => row?.category_id ?? row?.id).filter(Boolean));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one category.");
      return;
    }

    setDeleting(true);

    const res = await makeRequest(categoryModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: selectedRowIds,
      },
    });

    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Categories deleted successfully.");
      await getCategoryList();
      return;
    }

    toast.error(res?.message || "Error while deleting categories");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?.category_id ?? row?.id;
    if (!rowId) {
      toast.error("Category id not found.");
      return;
    }

    if (!window.confirm("Delete this category?")) return;

    setDeleting(true);
    const res = await makeRequest(categoryModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: [rowId],
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Category deleted successfully.");
      await getCategoryList();
      return;
    }

    toast.error(res?.message || "Error while deleting category");
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getCategoryList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
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
                fields={resolvedFilterFields}
                savedFilters={categoryModuleSchema.savedFilters}
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
            rows={categoryList}
            storageKey="category-module-column-widths"
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
            editRow={permissions.canEdit ? (category) => {
              setSelectedCategory(category);
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
