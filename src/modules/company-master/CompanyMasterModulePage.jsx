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

import CompanyMasterForm from "./components/CompanyMasterForm";
import { companyMasterFallbackColumns, companyMasterSchema } from "./data/module.schema";

function CompanyMasterModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || companyMasterSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);

  const [fields, setFields] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "company-master",
    companyList
  );

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: companyMasterSchema.skipFields,
    columnMappings: companyMasterSchema.columnMappings,
    tableCellConfig: companyMasterSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, companyMasterFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => companyMasterFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        companyMasterSchema.defaultColumns.map((key) => ({
          label: companyMasterFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getCompanyList = async () => {
    setLoading(true);

    const res = await makeRequest(companyMasterSchema.api.list, {
      method: "POST",
      body: {
        page,
        searchText: filterState.searchText,
        filters: filterState.filters,
        order: filterState.order,
        order_by: filterState.order_by,
      },
    });

    setLoading(false);

    if (res.success) {
      setCompanyList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }

    toast.error(res?.message || "Error while fetching companies");
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

    setSelectedRowIds(companyList.map((row) => row?.company_id ?? row?.id).filter(Boolean));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one company.");
      return;
    }

    setDeleting(true);

    const res = await makeRequest(companyMasterSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: selectedRowIds,
      },
    });

    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Companies deleted successfully.");
      await getCompanyList();
      return;
    }

    toast.error(res?.message || "Error while deleting companies");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?.company_id ?? row?.id;
    if (!rowId) {
      toast.error("Company id not found.");
      return;
    }

    if (!window.confirm("Delete this company?")) return;

    setDeleting(true);
    const res = await makeRequest(companyMasterSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: [rowId],
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Company deleted successfully.");
      await getCompanyList();
      return;
    }

    toast.error(res?.message || "Error while deleting company");
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getCompanyList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={companyMasterSchema.title}
        description={companyMasterSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getCompanyList}
            onCreate={() => {
              setSelectedCompany(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length > 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleting={deleting}
            createLabel="Add Company"
            filter={
              <DynamicFilter
                fields={resolvedFilterFields}
                savedFilters={companyMasterSchema.savedFilters}
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
            rows={companyList}
            storageKey="company-master-module-column-widths"
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
            editRow={permissions.canEdit ? (company) => {
              setSelectedCompany(company);
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

      <CompanyMasterForm
        isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedCompany(null);
        }}
        selectedCompany={selectedCompany}
        onAfterSave={getCompanyList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default CompanyMasterModulePage;
