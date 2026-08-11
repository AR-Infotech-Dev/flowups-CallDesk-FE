import { useEffect, useState } from "react";
import { useAppSelector, useModuleFilters } from "@store/hooks";
import { getNextSortConfig } from "@utils/sorting";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import DynamicFilter from "@components/dynamic-filter";
import ResizableTable from "@components/table/ResizableTable";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import LeadForm from "./components/LeadForm";
import LeadTableRow from "./components/LeadTableRow";
import { leadsModuleSchema } from "./data/module.schema";
import { selectLeadsRows } from "./data/leads.slice";
import { useLeadsModule } from "./hooks/useLeadsModule";
import { useLeadsTableConfig } from "./hooks/useLeadsTableConfig";

function LeadsModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || leadsModuleSchema.menu_id;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const rows = useAppSelector(selectLeadsRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters("leads", rows);
  const module = useLeadsModule({ filterState });
  const table = useLeadsTableConfig({ resolvedMenuID, filterState });

  useEffect(() => { module.getLeadList(); }, [module.page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);
  const handleSortChange = (key) => { const next = getNextSortConfig(table.sortConfig, key); if (module.page !== 1) module.handlePageChange(1); setSort({ order_by: next.key, order: next.direction.toUpperCase() }); };
  const close = () => { setIsOpen(false); setSelectedLead(null); };

  return <>
    <ModulePageLayout
      title={leadsModuleSchema.title}
      description={leadsModuleSchema.description}
      controls={<ModuleControls canCreate={permissions.canAdd} canDelete={permissions.canDelete} loading={module.loading} onRefresh={module.getLeadList} onCreate={() => { setSelectedLead(null); setIsOpen(true); }} onDeleteSelected={module.handleDeleteSelected} showDelete={module.selectedRowIds.length > 0} deleteDisabled={module.deleting || !module.selectedRowIds.length} deleting={module.deleting} createLabel="Add Lead" filter={<DynamicFilter filterState={filterState} fields={table.resolvedFilterFields} savedFilters={[]} onSearch={setSearchText} onApplyFilters={applyFilterPayload} onClearFilters={clearFilters} />} />}
      table={<ResizableTable loading={module.loading} menuId={resolvedMenuID} columns={table.resolvedColumns} rows={rows} storageKey="leads-module-column-widths" defaultVisibleColumnKeys={table.defaultVisibleColumnKeys} sortConfig={table.sortConfig} onSortChange={handleSortChange} editRow={permissions.canEdit ? (lead) => { setSelectedLead(lead); setIsOpen(true); } : undefined} onDeleteRow={permissions.canDelete ? module.handleDeleteRow : undefined} allowSelection={permissions.canDelete} selectedRowIds={module.selectedRowIds} onToggleRow={module.handleToggleRow} onToggleAllRows={module.handleToggleAllRows} renderRow={(row, index, columns, helpers) => <LeadTableRow row={row} index={index} columns={columns} table={helpers} />} />}
      footer={<ModulePagination pagination={module.pagination} onPageChange={module.handlePageChange} />}
    />
    <LeadForm isOpen={isOpen} onClose={close} selectedLead={selectedLead} onAfterSave={module.getLeadList} menu_id={resolvedMenuID} />
  </>;
}

export default LeadsModulePage;
