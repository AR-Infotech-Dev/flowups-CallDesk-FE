import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteCompanies, getCompanyList } from "./companyMaster.service";

const initialState = {
  rows: [],
  pagination: {},
  page: 1,
  loading: false,
  deleting: false,
  selectedRowIds: [],
  error: "",
};

export const fetchCompanies = createAsyncThunk(
  "companyMaster/fetchCompanies",
  async ({ filterState, page }, { rejectWithValue }) => {
    const res = await getCompanyList({ filterState, page });

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while fetching companies");
    }

    return {
      rows: res.data || [],
      pagination: res.pagination || {},
    };
  }
);

export const deleteCompanyItems = createAsyncThunk(
  "companyMaster/deleteCompanyItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await deleteCompanies(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while deleting companies");
    }

    return {
      message: res?.message || "Companies deleted successfully",
      deletedIds: selectedRowIds,
    };
  }
);

const companyMasterSlice = createSlice({
  name: "companyMaster",
  initialState,
  reducers: {
    setCompanyMasterPage(state, action) {
      state.page = action.payload || 1;
    },
    setCompanyMasterSelection(state, action) {
      state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearCompanyMasterSelection(state) {
      state.selectedRowIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.pagination = action.payload.pagination;
        state.selectedRowIds = [];
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching companies";
      })
      .addCase(deleteCompanyItems.pending, (state) => {
        state.deleting = true;
        state.error = "";
      })
      .addCase(deleteCompanyItems.fulfilled, (state) => {
        state.deleting = false;
        state.selectedRowIds = [];
      })
      .addCase(deleteCompanyItems.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Error while deleting companies";
      });
  },
});

export const {
  clearCompanyMasterSelection,
  setCompanyMasterPage,
  setCompanyMasterSelection,
} = companyMasterSlice.actions;

export const selectCompanyMasterRows = (state) => state.companyMaster.rows;
export const selectCompanyMasterPagination = (state) => state.companyMaster.pagination;
export const selectCompanyMasterPage = (state) => state.companyMaster.page;
export const selectCompanyMasterLoading = (state) => state.companyMaster.loading;
export const selectCompanyMasterDeleting = (state) => state.companyMaster.deleting;
export const selectCompanyMasterSelectedRowIds = (state) => state.companyMaster.selectedRowIds;
export const selectCompanyMasterError = (state) => state.companyMaster.error;

export default companyMasterSlice.reducer;
