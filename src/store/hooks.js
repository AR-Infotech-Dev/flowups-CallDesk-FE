import { useMemo, useSyncExternalStore } from "react";
import store from "./index";
import {
  clearModuleFilters,
  selectModuleFilterState,
  setModuleFilters,
  setModuleSort,
  setModuleSearchText,
} from "./moduleFiltersSlice";
import { applyModuleFilters } from "../utils/filtering";

export function useAppDispatch() {
  return store.dispatch;
}

export function useAppSelector(selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

export function useModuleFilters(moduleKey, rows = []) {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector((state) => selectModuleFilterState(state, moduleKey));

  const filteredRows = useMemo(
    () => applyModuleFilters(rows, filterState),
    [rows, filterState]
  );

  return {
    filterState,
    filteredRows,
    setSearchText: (searchText) => dispatch(setModuleSearchText({ moduleKey, searchText })),
    setFilters: ({ filters = [], selectedFilterId = "" }) => dispatch(setModuleFilters({ moduleKey, filters, selectedFilterId })),
    applyFilterPayload: ({ filters = [], selectedFilterId = "", searchText }) => dispatch(setModuleFilters({ moduleKey, filters, selectedFilterId, searchText })),
    setSort: ({ order_by, order }) => dispatch(setModuleSort({ moduleKey, order_by, order })),
    clearFilters: () => dispatch(clearModuleFilters(moduleKey)),
  };
}
