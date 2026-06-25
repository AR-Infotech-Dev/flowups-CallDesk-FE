import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import store from "./index";
import { clearModuleFilters, selectModuleFilterState, setModuleFilters, setModuleSort, setModuleSearchText,
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

const VALUELESS_CONDITIONS = new Set([
  "today",
  "tomorrow",
  "yesterday",
  "this_month",
  "this_week",
  "is_empty",
  "is_not_empty",
]);

function hasInitialFilterValue(filter = {}) {
  if (!filter.condition) return false;
  if (VALUELESS_CONDITIONS.has(filter.condition)) return true;
  if (filter.condition === "date_range") {
    return Boolean(filter.value?.from_date && filter.value?.to_date);
  }
  return String(filter.value ?? "").trim() !== "";
}

function normalizeInitialFilters(defaultFilters = []) {
  return defaultFilters
    .filter((filter) => filter?.field && hasInitialFilterValue(filter))
    .map((filter) => ({
      field: filter.field,
      condition: filter.condition,
      value: filter.value ?? "",
      type: filter.type,
    }));
}

export function useModuleFilters(moduleKey, rows = [], defaultFilters = []) {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector((state) => selectModuleFilterState(state, moduleKey));
  const initializedDefaultFiltersRef = useRef(false);
  const initialFilters = useMemo(
    () => normalizeInitialFilters(defaultFilters),
    [defaultFilters]
  );

  useLayoutEffect(() => {
    if (initializedDefaultFiltersRef.current || !initialFilters.length) return;
    if ((filterState.filters || []).length) {
      initializedDefaultFiltersRef.current = true;
      return;
    }

    initializedDefaultFiltersRef.current = true;
    dispatch(setModuleFilters({
      moduleKey,
      filters: initialFilters,
      selectedFilterId: "",
    }));
  }, [dispatch, filterState.filters, initialFilters, moduleKey]);

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
