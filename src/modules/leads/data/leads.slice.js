import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteLeads, getLeadsList } from "./leads.service";

const initialState = { rows: [], pagination: {}, page: 1, loading: false, deleting: false, selectedRowIds: [], error: "" };

export const fetchLeads = createAsyncThunk("leads/fetchLeads", async ({ filterState, page }, { rejectWithValue }) => {
  const res = await getLeadsList({ filterState, page });
  return res.success ? { rows: res.data || [], pagination: res.pagination || {} } : rejectWithValue(res.message || "Unable to fetch leads");
});

export const deleteLeadItems = createAsyncThunk("leads/deleteLeadItems", async (ids, { rejectWithValue }) => {
  const res = await deleteLeads(ids);
  return res.success ? { message: res.message || "Leads deleted successfully" } : rejectWithValue(res.message || "Unable to delete leads");
});

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setLeadsPage: (state, action) => { state.page = action.payload || 1; },
    setLeadsSelection: (state, action) => { state.selectedRowIds = Array.isArray(action.payload) ? action.payload : []; },
    clearLeadsSelection: (state) => { state.selectedRowIds = []; },
  },
  extraReducers: (builder) => builder
    .addCase(fetchLeads.pending, (state) => { state.loading = true; state.error = ""; })
    .addCase(fetchLeads.fulfilled, (state, action) => { state.loading = false; state.rows = action.payload.rows; state.pagination = action.payload.pagination; state.selectedRowIds = []; })
    .addCase(fetchLeads.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
    .addCase(deleteLeadItems.pending, (state) => { state.deleting = true; })
    .addCase(deleteLeadItems.fulfilled, (state) => { state.deleting = false; state.selectedRowIds = []; })
    .addCase(deleteLeadItems.rejected, (state, action) => { state.deleting = false; state.error = action.payload; }),
});

export const { setLeadsPage, setLeadsSelection, clearLeadsSelection } = leadsSlice.actions;
export const selectLeadsRows = (state) => state.leads.rows;
export const selectLeadsPagination = (state) => state.leads.pagination;
export const selectLeadsPage = (state) => state.leads.page;
export const selectLeadsLoading = (state) => state.leads.loading;
export const selectLeadsDeleting = (state) => state.leads.deleting;
export const selectLeadsSelectedRowIds = (state) => state.leads.selectedRowIds;
export default leadsSlice.reducer;
