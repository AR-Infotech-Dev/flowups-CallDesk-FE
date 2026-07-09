import { Columns3, Table2 } from "lucide-react";
import { useAuth } from "@auth/components/AuthProvider";
import { useAppDispatch, useAppSelector, useModuleFilters } from "@store/hooks";
import { getNextSortConfig } from "@utils/sorting";
import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import DynamicFilter from "@components/dynamic-filter";
import ResizableTable from "@components/table/ResizableTable";
import ActionButton from "@components/ui/ActionButton";
import KanbanBoard from "@components/kanban/KanbanBoard";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import TicketForm from "./components/TicketForm";
import TicketTableRow from "./components/TicketTableRow";
import { ticketsModuleSchema } from "./data/module.schema";
import { useTicketsModule } from "./hooks/useTicketsModule";
import { useTicketsTableConfig } from "./hooks/useTicketsTableConfig";
import { selectTicketsDefaultFilters, setTicketsPage, setTicketsViewAll } from "./data/tickets.slice";
function TicketsModulePage({ menu_id }) {
  const { authSession } = useAuth();
  const dispatch = useAppDispatch();
  const roleSlug = authSession?.user?.role_slug;
  const resolvedMenuID = menu_id || ticketsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const ticketDefaultFilters = useAppSelector(selectTicketsDefaultFilters);
  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("tickets", [], ticketDefaultFilters);

  const {
    ticketList,
    selectedTicket,
    isFlyoutOpen,
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    viewMode,
    setViewMode,
    viewAll,
    quickFilter,
    quickFilterList,
    setQuickFilter,
    kanbanReloadVersion,
    handlePageChange,
    refreshCurrentView,
    getKanbanColumnPage,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
    openCreateFlyout,
    openEditFlyout,
    closeFlyout,
    handleAfterTicketSave,
    bumpKanbanReload,
  } = useTicketsModule({ resolvedMenuID, filterState });

  const { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields, } = useTicketsTableConfig({ resolvedMenuID, filterState, role_slug: roleSlug });

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

  const handleClearFilters = () => {
    clearFilters();
    setQuickFilter("");
  };

  const handleQuickFilterChange = (event) => {
    setQuickFilter(event.target.value);
    if (page !== 1) {
      handlePageChange(1);
    }
  };

  const handleViewAllToggle = () => {
    if (page !== 1) {
      dispatch(setTicketsPage(1));
    }
    dispatch(setTicketsViewAll(!viewAll));
  };

  const canViewAll = roleSlug === "admin" || roleSlug === "super_admin";

  return (
    <>
      <ModulePageLayout
        title={ticketsModuleSchema.title}
        description={ticketsModuleSchema.description}
        controls={
          <div className="tickets-module-controls flex flex-col gap-3">
            <ModuleControls
              canCreate={permissions.canAdd}
              canDelete={permissions.canDelete}
              loading={loading}
              onRefresh={refreshCurrentView}
              onCreate={openCreateFlyout}
              onDeleteSelected={handleDeleteSelected}
              showDelete={selectedRowIds.length > 0}
              deleteDisabled={deleting || loading || selectedRowIds.length === 0}
              deleteLabel={`Delete Selected${selectedRowIds.length ? ` (${selectedRowIds.length})` : ""}`}
              deleting={deleting}
              filter={
                <DynamicFilter
                  filterState={filterState}
                  fields={resolvedFilterFields}
                  defaultFilters={ticketDefaultFilters}
                  savedFilters={ticketsModuleSchema.savedFilters}
                  onSearch={setSearchText}
                  onApplyFilters={applyFilterPayload}
                  onSaveFilter={() => { }}
                  onDeleteFilter={() => { }}
                  onSelectSavedFilter={() => { }}
                  onClearFilters={handleClearFilters}
                // onlySearchText
                />
              }
            >
              <div className="flex items-center gap-2" />
              <div className="ticket-view-controls flex items-center justify-end gap-2">
                <select
                  className="ticket-quick-filter h-7 min-w-[140px] rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-blue-100"
                  value={quickFilter}
                  onChange={handleQuickFilterChange}
                >
                  <option value="">Quick Filter</option>
                  {quickFilterList.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>

                <div className="view-switch" data-view={viewMode} aria-label="Ticket view mode">
                  <button
                    type="button"
                    className={`view-switch-button ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    <Table2 size={12} />
                    Table
                  </button>
                  <button
                    type="button"
                    className={`view-switch-button ${viewMode === "kanban" ? "active" : ""}`}
                    onClick={() => setViewMode("kanban")}
                  >
                    <Columns3 size={12} />
                    Kanban
                  </button>
                </div>

                {canViewAll ? (
                  <ActionButton
                    variant="ghost"
                    className={viewAll ? "ticket-view-all-button active" : "ticket-view-all-button"}
                    aria-pressed={viewAll}
                    onClick={handleViewAllToggle}
                  >
                    All
                  </ActionButton>
                ) : null}
              </div>
            </ModuleControls>
          </div>
        }
        table={viewMode === "table" ? (
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={resolvedColumns}
            rows={ticketList}
            storageKey="tickets-module-column-widths"
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
              <TicketTableRow
                row={row}
                index={index}
                columns={columns}
                table={table}
              />
            )}
          />
        ) : (
          <KanbanBoard
            rows={[]}
            menuId={resolvedMenuID}
            config={ticketsModuleSchema.kanban}
            loading={false}
            lazyLoad
            reloadKey={JSON.stringify({
              searchText: filterState.searchText,
              filters: filterState.filters,
              quickFilter,
              order: filterState.order,
              order_by: filterState.order_by,
              viewAll,
              kanbanReloadVersion,
            })}
            onLoadColumnPage={getKanbanColumnPage}
            editRow={permissions.canEdit ? openEditFlyout : undefined}
            allowUpdate={permissions.canEdit}
            onAfterUpdate={bumpKanbanReload}
          />
        )}
        footer={
          viewMode === "table" ? (
            <ModulePagination pagination={pagination} onPageChange={handlePageChange} />
          ) : null
        }
      />

      <TicketForm
        isOpen={isFlyoutOpen}
        onClose={closeFlyout}
        selectedTicket={selectedTicket}
        onAfterSave={handleAfterTicketSave}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default TicketsModulePage;
