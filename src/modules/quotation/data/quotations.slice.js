import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteQuotation, getQuotationsList } from "./quotations.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> quotations fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected quotation ids
    error: "",          // -> API error message
}

export const fetchQuotations = createAsyncThunk(
    "quotations/fetchQuotations",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getQuotationsList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching quotations");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteQuotations = createAsyncThunk(
    "quotations/deleteQuotations",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteQuotation(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting quotations");
        }

        return {
            message: res?.message || "Quotations deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const quotationsSlice = createSlice({
    name: "quotations",
    initialState,
    reducers: {
        setQuotationsPage(state, action) {
            state.page = action.payload || 1;
        },
        setQuotationsRows(state, action) {
            state.rows = action.payload || [];
        },
        setQuotationsLoading(state, action) {
            state.loading = action.payload;
        },
        setQuotationsDeleting(state, action) {
            state.deleting = action.payload;
        },
        setQuotationsPagination(state, action) {
            state.pagination = action.payload;
        },
        setQuotationsSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearQuotationsSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuotations.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchQuotations.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchQuotations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching quotations";
            })
            .addCase(deleteQuotations.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteQuotations.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteQuotations.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting quotations";
            });
    }
});

export const {
    setQuotationsPage,
    setQuotationsRows,
    setQuotationsLoading,
    setQuotationsDeleting,
    setQuotationsPagination,
    setQuotationsSelection,
    clearQuotationsSelection,
} = quotationsSlice.actions;

export default quotationsSlice.reducer;

export const selectQuotationsRows = (state) => state.quotations.rows;
export const selectQuotationsPagination = (state) => state.quotations.pagination;
export const selectQuotationsPage = (state) => state.quotations.page;
export const selectQuotationsLoading = (state) => state.quotations.loading;
export const selectQuotationsDeleting = (state) => state.quotations.deleting;
export const selectQuotationsSelectedRowIds = (state) => state.quotations.selectedRowIds;
export const selectQuotationsError = (state) => state.quotations.error;