import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteTickets, getTicketsList } from "./tickets.service";
import { normalizeTicketVisibility } from "../utils/tickets.utils";

const initialState = {
  rows: [],
  pagination: {},
  defaultFilters:[],
  page: 1,
  viewAll: false,
  loading: false,
  deleting: false,
  selectedRowIds: [],
  error: "",
};

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async ({ filterState, filters, page, viewAll }, { rejectWithValue }) => {
    const res = await getTicketsList({ filterState, filters, page, viewAll });

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while fetching tickets");
    }

    return {
      rows: (res.data || []).map(normalizeTicketVisibility),
      pagination: res.pagination || {},
    };
  }
);

export const deleteTicketItems = createAsyncThunk(
  "tickets/deleteTicketItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await deleteTickets(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while deleting tickets");
    }

    return {
      message: res?.message || "Tickets deleted successfully.",
      deletedIds: selectedRowIds,
    };
  }
);

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setTicketsDefualtFilters(state, action) {
      state.defaultFilters = action.payload || [];
    },
    setTicketsPage(state, action) {
      state.page = action.payload || 1;
    },
    setTicketsViewAll(state, action) {
      state.viewAll = Boolean(action.payload);
    },
    setTicketsSelection(state, action) {
      state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearTicketsSelection(state) {
      state.selectedRowIds = [];
    },
    resetTicketsTableState(state) {
      state.rows = [];
      state.pagination = {};
      state.selectedRowIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.pagination = action.payload.pagination;
        state.selectedRowIds = [];
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching tickets";
      })
      .addCase(deleteTicketItems.pending, (state) => {
        state.deleting = true;
        state.error = "";
      })
      .addCase(deleteTicketItems.fulfilled, (state) => {
        state.deleting = false;
        state.selectedRowIds = [];
      })
      .addCase(deleteTicketItems.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Error while deleting tickets";
      });
  },
});

export const {
  clearTicketsSelection,
  resetTicketsTableState,
  setTicketsPage,
  setTicketsSelection,
  setTicketsViewAll,
  setTicketsDefualtFilters,
} = ticketsSlice.actions;

export const selectTicketsRows = (state) => state.tickets.rows;
export const selectTicketsPagination = (state) => state.tickets.pagination;
export const selectTicketsViewAll = (state) => state.tickets.viewAll;
export const selectTicketsDefaultFilters = (state) => state.tickets.defaultFilters;
export const selectTicketsPage = (state) => state.tickets.page;
export const selectTicketsLoading = (state) => state.tickets.loading;
export const selectTicketsDeleting = (state) => state.tickets.deleting;
export const selectTicketsSelectedRowIds = (state) => state.tickets.selectedRowIds;
export const selectTicketsError = (state) => state.tickets.error;

export default ticketsSlice.reducer;
