import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { getViewMode, saveViewMode } from "@auth/utils/authStorage";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { ticketsModuleSchema } from "../data/module.schema";
import { getAmcticketKanbanColumnPage } from "../data/amctickets.service";
import {
  clearAmcticketsSelection,
  deleteAmcticketItems,
  fetchAmctickets,
  hideAmcticketItems,
  resetAmcticketsTableState,
  selectAmcticketsDeleting,
  selectAmcticketsHiding,
  selectAmcticketsLoading,
  selectAmcticketsPage,
  selectAmcticketsPagination,
  selectAmcticketsRows,
  selectAmcticketsSelectedRowIds,
  selectAmcticketsViewAll,
  setAmcticketsPage,
  setAmcticketsSelection,
  setAmcticketsDefualtFilters,
  selectAmcticketsDefaultFilters,
} from "../data/anctickets.slice";
import {
  getAmcticketIdentifier,
  getAmcticketQuickFilters,
  mergeAmcticketFilters,
  normalizeAmcticketVisibility,
} from "../utils/amctickets.utils";
import { TICKET_QUICK_FILTERS } from "../utils/amctickets.utils";


export const useAmcticketsModule = ({ resolvedMenuID, filterState }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const ticketList = useAppSelector(selectAmcticketsRows);
  const pagination = useAppSelector(selectAmcticketsPagination);
  const page = useAppSelector(selectAmcticketsPage);
  const viewAll = useAppSelector(selectAmcticketsViewAll);
  const loading = useAppSelector(selectAmcticketsLoading);
  const deleting = useAppSelector(selectAmcticketsDeleting);
  const hiding = useAppSelector(selectAmcticketsHiding);
  const selectedRowIds = useAppSelector(selectAmcticketsSelectedRowIds);
  const defaultFiltersArr = ticketsModuleSchema.defaultFilters;

  const [selectedAmcticket, setSelectedAmcticket] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [viewMode, setViewMode] = useState(getViewMode(resolvedMenuID) || "table");
  const [quickFilter, setQuickFilter] = useState("");
  const [quickFilterList, setQuickFilterList] = useState(TICKET_QUICK_FILTERS);
  const [kanbanReloadVersion, setKanbanReloadVersion] = useState(0);
  const isKanbanView = viewMode === "kanban";

  const activeQuickFilters = useMemo(() => getAmcticketQuickFilters(quickFilter), [quickFilter]);
  const combinedFilters = useMemo(
    () => mergeAmcticketFilters({ filterState, quickFilter }),
    [filterState.filters, activeQuickFilters]
  );

  useEffect(() => {
    const amcticket = location.state?.openAmcticket;
    if (amcticket?.amcticket_id) {
      setSelectedAmcticket(amcticket);
      setIsFlyoutOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    saveViewMode(resolvedMenuID, viewMode);
    if (viewMode === 'kanban') {
      dispatch(
        setAmcticketsDefualtFilters(
          defaultFiltersArr.filter(
            item => !["amcticket_status"].includes(item.field)
          )
        )
      );
      const removeValues = ["closed", "pending", "open", "in_progress"];
      setQuickFilterList((prev) =>
        prev.filter((item) => !removeValues.includes(item.value))
      );
    } else {
      dispatch(setAmcticketsDefualtFilters(defaultFiltersArr));
      setQuickFilterList(TICKET_QUICK_FILTERS);
    }
  }, [resolvedMenuID, viewMode]);

  const getAmcticketList = async () => {
    const action = await dispatch(fetchAmctickets({
      filterState,
      filters: combinedFilters,
      page,
      viewAll,
    }));

    if (fetchAmctickets.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching amctickets");
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

      const res = await getAmcticketKanbanColumnPage({
        columnId,
        columnPage,
        filterState,
        filters: [...kanbanFilters, ...quickKanbanFilters],
        viewAll,
      });

      if (!res.success) {
        throw new Error(res?.message || "Error while fetching kanban amctickets");
      }

      return {
        rows: (res.data || []).map(normalizeAmcticketVisibility),
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
    dispatch(setAmcticketsPage(nextPage));
  };

  const handleToggleRow = (rowId, checked) => {
    const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
    const nextSelectedRowIds = checked
      ? [...new Set([...currentSelectedRowIds, rowId])]
      : currentSelectedRowIds.filter((item) => item !== rowId);

    dispatch(setAmcticketsSelection(nextSelectedRowIds));
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      dispatch(clearAmcticketsSelection());
      return;
    }

    dispatch(setAmcticketsSelection(ticketList.map(getAmcticketIdentifier).filter(Boolean)));
  };

  const refreshCurrentView = () => {
    if (isKanbanView) {
      setKanbanReloadVersion((current) => current + 1);
      return;
    }

    getAmcticketList();
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one amcticket.");
      return;
    }

    const action = await dispatch(deleteAmcticketItems(selectedRowIds));

    if (deleteAmcticketItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Amctickets deleted successfully.");
      refreshCurrentView();
      return;
    }

    toast.error(action.payload || "Error while deleting amctickets");
  };

  const handleDeleteRow = async (row) => {
    const rowId = getAmcticketIdentifier(row);
    if (!rowId) {
      toast.error("Amcticket id not found.");
      return;
    }

    if (!window.confirm("Delete this amcticket?")) return;

    const action = await dispatch(deleteAmcticketItems([rowId]));

    if (deleteAmcticketItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Amcticket deleted successfully.");
      refreshCurrentView();
      return;
    }

    toast.error(action.payload || "Error while deleting amcticket");
  };

  const handleHideRow = async (row) => {
    const rowId = getAmcticketIdentifier(row);
    if (!rowId) {
      toast.error("Amcticket id not found.");
      return;
    }

    if (!window.confirm("Hide this AMC ticket?")) return;

    const action = await dispatch(hideAmcticketItems([rowId]));

    // if (hideAmcticketItems.fulfilled.match(action)) {
    //   toast.success(action.payload?.message || "AMC ticket hidden successfully.");
    //   refreshCurrentView();
    //   return;
    // }

    toast.error(action.payload || "Error while hiding AMC ticket");
  };

  const openCreateFlyout = () => {
    setSelectedAmcticket(null);
    setIsFlyoutOpen(true);
  };

  const openEditFlyout = (amcticket) => {
    setSelectedAmcticket(amcticket);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setIsFlyoutOpen(false);
    setSelectedAmcticket(null);
  };

  const handleAfterAmcticketSave = () => {
    refreshCurrentView();
  };

  useEffect(() => {
    if (isKanbanView) {
      dispatch(resetAmcticketsTableState());
      return;
    }

    getAmcticketList();
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
    selectedAmcticket,
    isFlyoutOpen,
    pagination,
    page,
    loading,
    deleting,
    hiding,
    selectedRowIds,
    viewMode,
    setViewMode,
    viewAll,
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
    handleHideRow,
    openCreateFlyout,
    openEditFlyout,
    closeFlyout,
    handleAfterAmcticketSave,
    bumpKanbanReload: () => setKanbanReloadVersion((current) => current + 1),
  };
};
