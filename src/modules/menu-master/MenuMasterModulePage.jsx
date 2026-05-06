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

import MenuForm from "./components/MenuForm";
import {
  menuMasterFallbackColumns,
  menuMasterSchema,
} from "./data/module.schema";

function MenuMasterModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || menuMasterSchema.menu_id || null;

  const [fields, setFields] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("menu-master", menuList);

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(
      filterState.order || defaultSortConfig.direction
    ).toLowerCase(),
  };

  const columnOptions = {
    skipFields: menuMasterSchema.skipFields,
    columnMappings: menuMasterSchema.columnMappings,
    tableCellConfig: menuMasterSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () =>
      buildTableColumnsFromStructure(
        fields,
        menuMasterFallbackColumns,
        columnOptions
      ),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () =>
      menuMasterFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        menuMasterSchema.defaultColumns.map((key) => ({
          label:
            menuMasterFallbackColumns.find(
              (column) => column.key === key
            )?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  // ======================================
  // GET MENU LIST
  // ======================================
  const getMenuList = async () => {
    setLoading(true);

    const res = await makeRequest(
      menuMasterSchema.api.list,
      {
        method: "POST",
        body: {
          status: "active",
          page,
          searchText: filterState.searchText,
          filters: filterState.filters,
          order: filterState.order,
          order_by: filterState.order_by,
        },
      }
    );

    setLoading(false);

    if (res.success) {
      setMenuList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedMenu(null);
      setSelectedRowIds([]);
      return;
    }

    toast.error(
      res?.message || "Error while fetching menus"
    );
  };

  // ======================================
  // GET FIELD DEFINITIONS
  // ======================================
  const getColumnList = async () => {
    const res = await getDefinitions(
      resolvedMenuID
    );

    if (res.success) {
      setFields(res.data || []);
      return;
    }

    toast.error(
      res?.message ||
        "Error while fetching module fields"
    );
  };

  // ======================================
  // DELETE SELECTED
  // ======================================
  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error(
        "Please select at least one menu."
      );
      return;
    }

    setDeleting(true);

    const res = await makeRequest(
      menuMasterSchema.api.delete,
      {
        method: "POST",
        body: {
          action: "delete",
          ids: selectedRowIds,
        },
      }
    );

    setDeleting(false);

    if (res.success) {
      toast.success(
        res?.message ||
          "Menus deleted successfully."
      );

      await getMenuList();
      return;
    }

    toast.error(
      res?.message ||
        "Error while deleting menus"
    );
  };

  // ======================================
  // ROW SELECT
  // ======================================
  const handleToggleRow = (
    rowId,
    checked
  ) => {
    setSelectedRowIds((current) =>
      checked
        ? [
            ...new Set([
              ...current,
              rowId,
            ]),
          ]
        : current.filter(
            (item) => item !== rowId
          )
    );
  };

  const handleToggleAllRows = (
    checked
  ) => {
    if (!checked) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(
      menuList
        .map(
          (row) =>
            row?.menu_id ??
            row?.id
        )
        .filter(Boolean)
    );
  };

  // ======================================
  // EFFECTS
  // ======================================
  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getMenuList();
  }, [
    page,
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(
      filterState.filters
    ),
  ]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(
      filterState.filters
    ),
  ]);

  return (
    <>
      <ModulePageLayout
        title={menuMasterSchema.title}
        description={
          menuMasterSchema.description
        }
        controls={
          <ModuleControls
            loading={loading}
            onRefresh={getMenuList}
            onCreate={() => {
              setSelectedMenu(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={
              handleDeleteSelected
            }
            showDelete={
              selectedRowIds.length !== 0
            }
            deleteDisabled={
              deleting ||
              loading ||
              selectedRowIds.length === 0
            }
            deleteLabel={`Delete Selected${
              selectedRowIds.length
                ? ` (${selectedRowIds.length})`
                : ""
            }`}
            deleting={deleting}
            filter={
              <DynamicFilter
                fields={
                  resolvedFilterFields
                }
                savedFilters={
                  menuMasterSchema.savedFilters
                }
                onSearch={
                  setSearchText
                }
                onApplyFilters={
                  applyFilterPayload
                }
                onSaveFilter={() => {}}
                onDeleteFilter={() => {}}
                onSelectSavedFilter={() => {}}
                onClearFilters={
                  clearFilters
                }
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            columns={
              resolvedColumns
            }
            rows={menuList}
            storageKey="menu-module-column-widths"
            defaultVisibleColumnKeys={
              defaultVisibleColumnKeys
            }
            sortConfig={
              sortConfig
            }
            onSortChange={(
              columnKey
            ) => {
              const nextSort =
                getNextSortConfig(
                  sortConfig,
                  columnKey
                );

              if (page !== 1) {
                setPage(1);
              }

              setSort({
                order_by:
                  nextSort.key,
                order:
                  nextSort.direction.toUpperCase(),
              });
            }}
            editRow={(menu) => {
              setSelectedMenu(menu);
              setIsFlyoutOpen(true);
            }}
            selectedRowIds={
              selectedRowIds
            }
            onToggleRow={
              handleToggleRow
            }
            onToggleAllRows={
              handleToggleAllRows
            }
          />
        }
        footer={
          <ModulePagination
            pagination={
              pagination
            }
            onPageChange={
              setPage
            }
          />
        }
      />

      <MenuForm
        isOpen={isFlyoutOpen}
        onClose={() =>
          setIsFlyoutOpen(false)
        }
        selectedMenu={
          selectedMenu
        }
        onAfterSave={
          getMenuList
        }
      />
    </>
  );
}

export default MenuMasterModulePage;
