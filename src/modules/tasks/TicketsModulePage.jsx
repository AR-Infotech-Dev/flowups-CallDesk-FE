import { toast } from "react-toastify";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { makeRequest } from "../../api/httpClient";
import { useModuleFilters } from "../../store/hooks";
import { useLocation } from "react-router-dom";
import {
  defaultSortConfig,
  getNextSortConfig,
} from "../../utils/sorting";

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
import ActionButton from "../../components/ui/ActionButton";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import useMenuPermissions from "../../auth/useMenuPermissions";

import TicketForm from "./components/TicketForm";

import {
  ticketsFallbackColumns,
  ticketsModuleSchema,
} from "./data/module.schema";

function TicketModulePage({ menu_id }) {
  const location = useLocation();
  const { authSession } = useAuth();
  const role_slug = authSession?.user?.role_slug;
  // console.log(authSession.user.role_slug);

  // const role_slug = authSession.user.role_slug;
  // ==================================================
  // STATES
  // ==================================================
  const resolvedMenuID = menu_id || ticketsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [fields, setFields] = useState([]);
  const [ticketList, setTicketList] = useState([]);
  const [selectedTicket, setSelectedTicket,] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds,] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [viewAll, setViewAll] = useState(false);

  // ==================================================
  // FILTERS
  // ==================================================
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters, } = useModuleFilters("tickets", ticketList);
  useEffect(() => {
    const ticket = location.state?.openTicket;
    if (ticket?.ticket_id) {
      setSelectedTicket(ticket);
      setIsFlyoutOpen(true);
    }
  }, [location.state]);

  // ==================================================
  // SORT CONFIG
  // ==================================================
  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  // ==================================================
  // COLUMN OPTIONS
  // ==================================================
  const columnOptions = {
    skipFields: ticketsModuleSchema.skipFields,
    columnMappings: ticketsModuleSchema.columnMappings,
    tableCellConfig: ticketsModuleSchema.tableCellConfig,
  };

  // ==================================================
  // TABLE COLUMNS
  // ==================================================
  const resolvedColumns = useMemo(() => buildTableColumnsFromStructure(fields, ticketsFallbackColumns, columnOptions), [fields]);
  const defaultVisibleColumnKeys = useMemo(() => ticketsFallbackColumns.map((column) => column.key), []);

  // ==================================================
  // FILTER FIELDS
  // ==================================================
  const resolvedFilterFields = useMemo(() => buildFilterFieldsFromStructure(fields, ticketsModuleSchema.defaultColumns.map((key) => ({ label: ticketsFallbackColumns.find((column) => column.key === key)?.label || key, value: key, type: "text", })), columnOptions), [fields]);

  // ==================================================
  // GET LIST
  // ==================================================
  const getTicketList = async () => {
    setLoading(true);
    const res = await makeRequest(ticketsModuleSchema.api.list,
      {
        method: "POST",
        body: {
          status: "active",
          page,
          searchText: filterState.searchText,
          filters: filterState.filters,
          order: filterState.order,
          order_by: filterState.order_by,
          viewAll: viewAll ? 'Y' : 'N' ,
        },
      }
    );

    setLoading(false);

    if (res.success) {
      setTicketList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }
    toast.error(res?.message || "Error while fetching tickets");
  };

  // Kanban fetches every status column independently so each column can lazy-load its own pages.
  const getKanbanColumnPage = useCallback(
    async ({ columnId, page: columnPage }) => {
      const statusFilter = {
        field: ticketsModuleSchema.kanban.statusField,
        condition: "equal_to",
        value: String(columnId),
        type: "select",
      };

      const res = await makeRequest(ticketsModuleSchema.api.list, {
        method: "POST",
        body: {
          status: "active",
          page: columnPage,
          searchText: filterState.searchText,
          filters: [
            ...(filterState.filters || []),
            statusFilter,
          ],
          order: filterState.order,
          order_by: filterState.order_by,
          [ticketsModuleSchema.kanban.statusField]: columnId,
        },
      });

      if (!res.success) {
        throw new Error(res?.message || "Error while fetching kanban tickets");
      }

      return {
        rows: res.data || [],
        pagination: res.pagination || {},
      };
    },
    [
      filterState.searchText,
      filterState.order,
      filterState.order_by,
      JSON.stringify(filterState.filters),
    ]
  );

  // ==================================================
  // GET DEFINITIONS
  // ==================================================
  const getColumnList =
    async () => {
      const res = await getDefinitions(resolvedMenuID);
      if (res.success) {
        setFields(res.data || []);
      }
    };

  // ==================================================
  // ROW SELECT
  // ==================================================
  const handleToggleRow = (rowId, checked) => {
    setSelectedRowIds((current) =>
      checked
        ? [
          ...new Set([
            ...current,
            rowId,
          ]),
        ]
        : current.filter(
          (item) =>
            item !== rowId
        )
    );
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(ticketList.map((row) =>
      row?.ticketID
    ).filter(Boolean)
    );
  };

  // ==================================================
  // DELETE SELECTED
  // ==================================================
  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one ticket.");
      return;
    }
    setDeleting(true);
    const res = await makeRequest(ticketsModuleSchema.api.delete,
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
      toast.success(res?.message || "Tickets deleted successfully.");
      await getTicketList();
      return;
    }

    toast.error(res?.message || "Error while deleting tickets");
  };

  // ==================================================
  // EFFECTS
  // ==================================================
  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getTicketList();
  }, [
    page,
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(
      filterState.filters
    ),
    viewAll
  ]);

  useEffect(() => {
    if (page !== 1) { setPage(1); }
  }, [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(
      filterState.filters
    ),
  ]);

  // ==================================================
  // UI
  // ==================================================
  return (
    <>
      <ModulePageLayout
        // title={ticketsModuleSchema.title}
        title='Tickets'
        description='Tasks Modue'
        // description=. {ticketsModuleSchema.description}
        controls={
          <div className="flex flex-col gap-3">
            <ModuleControls
              canCreate={permissions.canAdd}
              canDelete={permissions.canDelete}
              loading={loading}
              onRefresh={getTicketList}
              onCreate={() => {
                setSelectedTicket(null);
                setIsFlyoutOpen(true);
              }}
              onDeleteSelected={
                handleDeleteSelected
              }
              showDelete={selectedRowIds.length > 0}
              deleteDisabled={deleting || loading || selectedRowIds.length === 0}
              deleteLabel={`Delete Selected${selectedRowIds.length ? ` (${selectedRowIds.length})` : ""}`}
              deleting={deleting}
              filter={
                <DynamicFilter
                  fields={resolvedFilterFields}
                  savedFilters={ticketsModuleSchema.savedFilters}
                  onSearch={setSearchText}
                  onApplyFilters={applyFilterPayload}
                  onSaveFilter={() => { }}
                  onDeleteFilter={() => { }}
                  onSelectSavedFilter={() => { }}
                  onClearFilters={clearFilters}
                />
              }
            >
              <div className="flex items-center justify-end gap-2">
                <ActionButton variant={viewMode === "table" ? "ghostPrimary" : "ghost"} onClick={() => setViewMode("table")}>Table</ActionButton>
                <ActionButton variant={viewMode === "kanban" ? "ghostPrimary" : "ghost"} onClick={() => setViewMode("kanban")}>Kanban</ActionButton>
                {
                  (role_slug == "admin" || role_slug == "super_admin") && 
                  <ActionButton variant={viewAll ? "ghostPrimary" : "ghost"} onClick={() => setViewAll((prev)=> !prev)}>All</ActionButton>
                }
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
            onSortChange={(columnKey) => {
              const nextSort = getNextSortConfig(sortConfig, columnKey);
              if (page !== 1) { setPage(1); }

              setSort({
                order_by: nextSort.key,
                order: nextSort.direction.toUpperCase(),
              });
            }}
            editRow={permissions.canEdit ? (ticket) => {
              setSelectedTicket(ticket);
              setIsFlyoutOpen(true);
            } : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
          />
        ) : (
          <KanbanBoard
            rows={ticketList}
            menuId={resolvedMenuID}
            config={ticketsModuleSchema.kanban}
            loading={loading}
            lazyLoad
            reloadKey={JSON.stringify({
              searchText: filterState.searchText,
              filters: filterState.filters,
              order: filterState.order,
              order_by: filterState.order_by,
            })}
            onLoadColumnPage={getKanbanColumnPage}
            editRow={permissions.canEdit ? (ticket) => {
              setSelectedTicket(ticket);
              setIsFlyoutOpen(true);
            } : undefined}
            allowUpdate={permissions.canEdit}
            onAfterUpdate={getTicketList}
          />
        )
        }
        footer={
          viewMode === "table" ? (
            <ModulePagination pagination={pagination} onPageChange={setPage} />
          ) : null
        }
      />

      <TicketForm isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedTicket(null);
        }}
        selectedTicket={selectedTicket}
        onAfterSave={getTicketList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default TicketModulePage;
