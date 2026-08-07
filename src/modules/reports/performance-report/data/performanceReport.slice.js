import { createSlice } from "@reduxjs/toolkit";

export const initialPerformanceFilters = {
  user_id: "",
  from_date: "",
  to_date: "",
  company_id: "",
  ticket_status: "",
};

const initialState = {
  // Filter controlsमध्ये सध्या दिसणारी values.
  filters: { ...initialPerformanceFilters },
  // Search click केल्यावर report APIला गेलेली values.
  appliedFilters: { ...initialPerformanceFilters },
};

const performanceReportSlice = createSlice({
  name: "performanceReport",
  initialState,
  reducers: {
    setPerformanceFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...(action.payload || {}),
      };
    },
    applyPerformanceFilters(state, action) {
      const nextFilters = {
        ...initialPerformanceFilters,
        ...(action.payload || state.filters),
      };
      state.filters = nextFilters;
      state.appliedFilters = nextFilters;
    },
    resetPerformanceFilters(state) {
      state.filters = { ...initialPerformanceFilters };
      state.appliedFilters = { ...initialPerformanceFilters };
    },
  },
});

export const {
  setPerformanceFilters,
  applyPerformanceFilters,
  resetPerformanceFilters,
} = performanceReportSlice.actions;

export const selectPerformanceFilters = (state) =>
  state.performanceReport?.filters || initialPerformanceFilters;
export const selectAppliedPerformanceFilters = (state) =>
  state.performanceReport?.appliedFilters || initialPerformanceFilters;

export default performanceReportSlice.reducer;
