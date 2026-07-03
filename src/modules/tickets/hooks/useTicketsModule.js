import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { getViewMode, saveViewMode } from "@auth/utils/authStorage";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { ticketsModuleSchema } from "../data/module.schema";
import { getTicketKanbanColumnPage } from "../data/tickets.service";
import {
  clearTicketsSelection,
  deleteTicketItems,
  fetchTickets,
  resetTicketsTableState,
  selectTicketsDeleting,
  selectTicketsLoading,
  selectTicketsPage,
  selectTicketsPagination,
  selectTicketsRows,
  selectTicketsSelectedRowIds,
  setTicketsPage,
  setTicketsSelection,
  setTicketsDefualtFilters,
  selectTicketsDefaultFilters,
} from "../data/tickets.slice";
import {
  getTicketIdentifier,
  getTicketQuickFilters,
  mergeTicketFilters,
  normalizeTicketVisibility,
} from "../utils/tickets.utils";
import { TICKET_QUICK_FILTERS } from "../utils/tickets.utils";


export const useTicketsModule = ({ resolvedMenuID, filterState }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const ticketList = useAppSelector(selectTicketsRows);
  const pagination = useAppSelector(selectTicketsPagination);
  const page = useAppSelector(selectTicketsPage);
  const loading = useAppSelector(selectTicketsLoading);
  const deleting = useAppSelector(selectTicketsDeleting);
  const selectedRowIds = useAppSelector(selectTicketsSelectedRowIds);
  const defaultFiltersArr = ticketsModuleSchema.defaultFilters;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [viewMode, setViewMode] = useState(getViewMode(resolvedMenuID) || "table");
  const [viewAll, setViewAll] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");
  const [quickFilterList, setQuickFilterList] = useState(TICKET_QUICK_FILTERS);
  const [kanbanReloadVersion, setKanbanReloadVersion] = useState(0);
  const isKanbanView = viewMode === "kanban";

  const activeQuickFilters = useMemo(() => getTicketQuickFilters(quickFilter), [quickFilter]);
  const combinedFilters = useMemo(
    () => mergeTicketFilters({ filterState, quickFilter }),
    [filterState.filters, activeQuickFilters]
  );

  useEffect(() => {
    const ticket = location.state?.openTicket;
    if (ticket?.ticket_id) {
      setSelectedTicket(ticket);
      setIsFlyoutOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    saveViewMode(resolvedMenuID, viewMode);
    if (viewMode === 'kanban') {
      dispatch(
        setTicketsDefualtFilters(
          defaultFiltersArr.filter(
            item => !["ticket_status"].includes(item.field)
          )
        )
      );
      const removeValues = ["closed", "pending", "open", "in_progress"];
      setQuickFilterList((prev) =>
        prev.filter((item) => !removeValues.includes(item.value))
      );
    } else {
      dispatch(setTicketsDefualtFilters(defaultFiltersArr));
      setQuickFilterList(TICKET_QUICK_FILTERS);
    }
  }, [resolvedMenuID, viewMode]);

  const getTicketList = async () => {
    const action = await dispatch(fetchTickets({
      filterState,
      filters: combinedFilters,
      page,
      viewAll,
    }));

    if (fetchTickets.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching tickets");
    }
  };

  const getKanbanColumnPage = useCallback(
    async ({ columnId, page: columnPage }) => {
      const kanbanFilters = (filterState.filters || []).filter(
        (filter) => filter?.field !== ticketsModuleSchema.kanban.statusField
      );
      const quickKanbanFilters = activeQuickFilters.filter(
        (filter) => filter?.field !== ticketsModuleSchema.kanban.statusField
      );

      const res = await getTicketKanbanColumnPage({
        columnId,
        columnPage,
        filterState,
        filters: [...kanbanFilters, ...quickKanbanFilters],
        viewAll,
      });

      if (!res.success) {
        throw new Error(res?.message || "Error while fetching kanban tickets");
      }

      return {
        rows: (res.data || []).map(normalizeTicketVisibility),
        pagination: res.pagination || {},
      };
    },
    [
      filterState.searchText,
      filterState.order,
      filterState.order_by,
      JSON.stringify(filterState.filters),
      JSON.stringify(activeQuickFilters),
      viewAll,
    ]
  );

  const handlePageChange = (nextPage) => {
    dispatch(setTicketsPage(nextPage));
  };

  const handleToggleRow = (rowId, checked) => {
    const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
    const nextSelectedRowIds = checked
      ? [...new Set([...currentSelectedRowIds, rowId])]
      : currentSelectedRowIds.filter((item) => item !== rowId);

    dispatch(setTicketsSelection(nextSelectedRowIds));
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      dispatch(clearTicketsSelection());
      return;
    }

    dispatch(setTicketsSelection(ticketList.map(getTicketIdentifier).filter(Boolean)));
  };

  const refreshCurrentView = () => {
    if (isKanbanView) {
      setKanbanReloadVersion((current) => current + 1);
      return;
    }

    getTicketList();
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one ticket.");
      return;
    }

    const action = await dispatch(deleteTicketItems(selectedRowIds));

    if (deleteTicketItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Tickets deleted successfully.");
      refreshCurrentView();
      return;
    }

    toast.error(action.payload || "Error while deleting tickets");
  };

  const handleDeleteRow = async (row) => {
    const rowId = getTicketIdentifier(row);
    if (!rowId) {
      toast.error("Ticket id not found.");
      return;
    }

    if (!window.confirm("Delete this ticket?")) return;

    const action = await dispatch(deleteTicketItems([rowId]));

    if (deleteTicketItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Ticket deleted successfully.");
      refreshCurrentView();
      return;
    }

    toast.error(action.payload || "Error while deleting ticket");
  };

  const openCreateFlyout = () => {
    setSelectedTicket(null);
    setIsFlyoutOpen(true);
  };

  const openEditFlyout = (ticket) => {
    setSelectedTicket(ticket);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setIsFlyoutOpen(false);
    setSelectedTicket(null);
  };

  const handleAfterTicketSave = () => {
    refreshCurrentView();
  };

  useEffect(() => {
    if (isKanbanView) {
      dispatch(resetTicketsTableState());
      return;
    }

    getTicketList();
  }, [isKanbanView, page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(combinedFilters), viewAll,]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [
    isKanbanView,
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    quickFilter,
    JSON.stringify(filterState.filters),
  ]);

  return {
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
    setViewAll,
    quickFilter,
    quickFilterList,
    setQuickFilter,
    kanbanReloadVersion,
    isKanbanView,
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
    bumpKanbanReload: () => setKanbanReloadVersion((current) => current + 1),
  };
};
