import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteAmctickets, getAmcticketsList,  } from "./amctickets.service";
import { normalizeAmcticketVisibility } from "../utils/amctickets.utils";

const initialState = {
  rows: [],
  pagination: {},
  defaultFilters:[],
  page: 1,
  viewAll: false,
  loading: false,
  deleting: false,
  hiding: false,
  selectedRowIds: [],
  error: "",
};

export const fetchAmctickets = createAsyncThunk(
  "amctickets/fetchAmctickets",
  async ({ filterState, filters, page, viewAll }, { rejectWithValue }) => {
    const res = await getAmcticketsList({ filterState, filters, page, viewAll });

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while fetching AMC tickets");
    }

    return {
      rows: (res.data || []).map(normalizeAmcticketVisibility),
      pagination: res.pagination || {},
    };
  }
);

export const deleteAmcticketItems = createAsyncThunk(
  "amctickets/deleteAmcticketItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await deleteAmctickets(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while deleting AMC tickets");
    }

    return {
      message: res?.message || "AMC tickets deleted successfully.",
      deletedIds: selectedRowIds,
    };
  }
);

export const hideAmcticketItems = createAsyncThunk(
  "amctickets/hideAmcticketItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await hideAmctickets(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while hiding AMC tickets");
    }

    return {
      message: res?.message || "AMC tickets hidden successfully.",
      hiddenIds: selectedRowIds,
    };
  }
);

const amcticketsSlice = createSlice({
  name: "amctickets",
  initialState,
  reducers: {
    setAmcticketsDefualtFilters(state, action) {
      state.defaultFilters = action.payload || [];
    },
    setAmcticketsPage(state, action) {
      state.page = action.payload || 1;
    },
    setAmcticketsViewAll(state, action) {
      state.viewAll = Boolean(action.payload);
    },
    setAmcticketsSelection(state, action) {
      state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearAmcticketsSelection(state) {
      state.selectedRowIds = [];
    },
    resetAmcticketsTableState(state) {
      state.rows = [];
      state.pagination = {};
      state.selectedRowIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAmctickets.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchAmctickets.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.pagination = action.payload.pagination;
        state.selectedRowIds = [];
      })
      .addCase(fetchAmctickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching AMC tickets";
      })
      .addCase(deleteAmcticketItems.pending, (state) => {
        state.deleting = true;
        state.error = "";
      })
      .addCase(deleteAmcticketItems.fulfilled, (state) => {
        state.deleting = false;
        state.selectedRowIds = [];
      })
      .addCase(deleteAmcticketItems.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Error while deleting AMC tickets";
      })
      .addCase(hideAmcticketItems.pending, (state) => {
        state.hiding = true;
        state.error = "";
      })
      .addCase(hideAmcticketItems.fulfilled, (state) => {
        state.hiding = false;
        state.selectedRowIds = [];
      })
      .addCase(hideAmcticketItems.rejected, (state, action) => {
        state.hiding = false;
        state.error = action.payload || "Error while hiding AMC tickets";
      });
  },
});

export const {
  clearAmcticketsSelection,
  resetAmcticketsTableState,
  setAmcticketsPage,
  setAmcticketsSelection,
  setAmcticketsViewAll,
  setAmcticketsDefualtFilters,
} = amcticketsSlice.actions;

export const selectAmcticketsRows = (state) => state.amctickets.rows;
export const selectAmcticketsPagination = (state) => state.amctickets.pagination;
export const selectAmcticketsViewAll = (state) => state.amctickets.viewAll;
export const selectAmcticketsDefaultFilters = (state) => state.amctickets.defaultFilters;
export const selectAmcticketsPage = (state) => state.amctickets.page;
export const selectAmcticketsLoading = (state) => state.amctickets.loading;
export const selectAmcticketsDeleting = (state) => state.amctickets.deleting;
export const selectAmcticketsHiding = (state) => state.amctickets.hiding;
export const selectAmcticketsSelectedRowIds = (state) => state.amctickets.selectedRowIds;
export const selectAmcticketsError = (state) => state.amctickets.error;

export default amcticketsSlice.reducer;
