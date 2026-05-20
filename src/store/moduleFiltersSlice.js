import { createSlice } from "@reduxjs/toolkit";

const defaultModuleState = {
  searchText: "",
  filters: [],
  order: "DESC",
  order_by: "created_by",
  selectedFilterId: "",
};

const initialState = {
  byModule: {},
};

function getModuleState(state, moduleKey) {
  if (!state.byModule[moduleKey]) {
    state.byModule[moduleKey] = { ...defaultModuleState };
  }

  return state.byModule[moduleKey];
}

const moduleFiltersSlice = createSlice({
  name: "moduleFilters",
  initialState,
  reducers: {
    setModuleSearchText(state, action) {
      const { moduleKey, searchText } = action.payload;
      const moduleState = getModuleState(state, moduleKey);
      moduleState.searchText = searchText || "";
    },
    setModuleFilters(state, action) {
      const {
        moduleKey,
        filters = [],
        selectedFilterId = "",
        searchText,
      } = action.payload;
      const moduleState = getModuleState(state, moduleKey);
      moduleState.filters = filters;
      moduleState.selectedFilterId = selectedFilterId;
      if (typeof searchText === "string") {
        moduleState.searchText = searchText;
      }
    },
    setModuleSort(state, action) {
      const { moduleKey, order_by, order } = action.payload;
      const moduleState = getModuleState(state, moduleKey);
      moduleState.order_by = order_by || defaultModuleState.order_by;
      moduleState.order = order || defaultModuleState.order;
    },
    clearModuleFilters(state, action) {
      const moduleKey = action.payload;
      state.byModule[moduleKey] = { ...defaultModuleState };
    },
  },
});

export const {
  setModuleSearchText,
  setModuleFilters,
  setModuleSort,
  clearModuleFilters,
} = moduleFiltersSlice.actions;

export const selectModuleFilterState = (state, moduleKey) => state.moduleFilters.byModule[moduleKey] || defaultModuleState;

export default moduleFiltersSlice.reducer;
