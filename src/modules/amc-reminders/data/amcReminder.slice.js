import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAmcReminders } from "./amcReminders.service";

const initialState = {
  rows: [],
  pagination: {},
  page: 1,
  loading: false,
  error: "",
};

export const fetchAmcReminders = createAsyncThunk(
  "amcManagement/fetchAmcReminders",
  async ({ page, filterState, order, order_by }, { rejectWithValue }) => {
    const response = await getAmcReminders({
      page,
      searchText: filterState.searchText,
      filters: filterState.filters,
      order,
      order_by,
    });

    if (!response?.success) {
      return rejectWithValue(response?.message || "Error while fetching AMC reminders");
    }

    return {
      rows: response.data || [],
      pagination: response.pagination || {},
    };
  }
);

const amcReminderSlice = createSlice({
  name: "amcManagement",
  initialState,
  reducers: {
    setAmcPage(state, action) {
      state.page = action.payload || 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAmcReminders.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchAmcReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAmcReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching AMC reminders";
      });
  },
});

export const { setAmcPage } = amcReminderSlice.actions;

export const selectAmcRows = (state) => state.amcManagement.rows;
export const selectAmcPagination = (state) => state.amcManagement.pagination;
export const selectAmcPage = (state) => state.amcManagement.page;
export const selectAmcLoading = (state) => state.amcManagement.loading;
export const selectAmcError = (state) => state.amcManagement.error;

export default amcReminderSlice.reducer;
