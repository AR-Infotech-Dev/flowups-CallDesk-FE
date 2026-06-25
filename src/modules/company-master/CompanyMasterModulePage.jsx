import { useEffect, useState } from "react";

import { useModuleFilters } from "../../store/hooks";
import { getNextSortConfig } from "../../utils/sorting";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import DynamicFilter from "../../components/dynamic-filter";
import ResizableTable from "../../components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";

import CompanyMasterForm from "./components/CompanyMasterForm";
import CompanyMasterTableRow from "./components/CompanyMasterTableRow";
import { companyMasterSchema } from "./data/module.schema";
import { useCompanyMasterModule } from "./hooks/useCompanyMasterModule";
import { useCompanyMasterTableConfig } from "./hooks/useCompanyMasterTableConfig";

function CompanyMasterModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || companyMasterSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "company-master"
  );

  const {
    companyList,
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    handlePageChange,
    getCompanies,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
  } = useCompanyMasterModule({ filterState });

  const {
    sortConfig,
    resolvedColumns,
    defaultVisibleColumnKeys,
    resolvedFilterFields,
  } = useCompanyMasterTableConfig({ resolvedMenuID, filterState });

  useEffect(() => {
    getCompanies();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  const openCreateFlyout = () => {
    setSelectedCompany(null);
    setIsFlyoutOpen(true);
  };

  const openEditFlyout = (company) => {
    setSelectedCompany(company);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setIsFlyoutOpen(false);
    setSelectedCompany(null);
  };

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
            onRefresh={getCompanies}
            onCreate={openCreateFlyout}
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
            onSortChange={handleSortChange}
            editRow={permissions.canEdit ? openEditFlyout : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <CompanyMasterTableRow
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

      <CompanyMasterForm
        isOpen={isFlyoutOpen}
        onClose={closeFlyout}
        selectedCompany={selectedCompany}
        onAfterSave={getCompanies}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default CompanyMasterModulePage;
