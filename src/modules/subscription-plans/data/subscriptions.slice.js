import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteSubscription, getSubscriptionsList } from "./subscriptions.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> subscriptions fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected subscription ids
    error: "",          // -> API error message
}

export const fetchSubscriptions = createAsyncThunk(
    "subscriptions/fetchSubscriptions",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getSubscriptionsList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching subscriptions");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteSubscriptions = createAsyncThunk(
    "subscriptions/deleteSubscriptions",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteSubscription(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting subscriptions");
        }

        return {
            message: res?.message || "Subscriptions deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const subscriptionsSlice = createSlice({
    name: "subscriptions",
    initialState,
    reducers: {
        setSubscriptionsPage(state, action) {
            state.page = action.payload || 1;
        },
        setSubscriptionsRows(state, action) {
            state.rows = action.payload || [];
        },
        setSubscriptionsLoading(state, action) {
            state.loading = action.payload;
        },
        setSubscriptionsDeleting(state, action) {
            state.deleting = action.payload;
        },
        setSubscriptionsPagination(state, action) {
            state.pagination = action.payload;
        },
        setSubscriptionsSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearSubscriptionsSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSubscriptions.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchSubscriptions.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchSubscriptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching subscriptions";
            })
            .addCase(deleteSubscriptions.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteSubscriptions.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteSubscriptions.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting subscriptions";
            });
    }
});

export const {
    setSubscriptionsPage,
    setSubscriptionsRows,
    setSubscriptionsLoading,
    setSubscriptionsDeleting,
    setSubscriptionsPagination,
    setSubscriptionsSelection,
    clearSubscriptionsSelection,
} = subscriptionsSlice.actions;

export default subscriptionsSlice.reducer;

export const selectSubscriptionsRows = (state) => state.subscriptions.rows;
export const selectSubscriptionsPagination = (state) => state.subscriptions.pagination;
export const selectSubscriptionsPage = (state) => state.subscriptions.page;
export const selectSubscriptionsLoading = (state) => state.subscriptions.loading;
export const selectSubscriptionsDeleting = (state) => state.subscriptions.deleting;
export const selectSubscriptionsSelectedRowIds = (state) => state.subscriptions.selectedRowIds;
export const selectSubscriptionsError = (state) => state.subscriptions.error;