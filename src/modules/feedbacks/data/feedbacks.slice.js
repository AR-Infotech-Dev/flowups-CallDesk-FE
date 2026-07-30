import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteFeedback, getFeedbacksList } from "./feedbacks.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> feedbacks fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected user ids
    error: "",          // -> API error message
}

export const fetchFeedbacks = createAsyncThunk(
    "feedbacks/fetchFeedbacks",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getFeedbacksList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching feedbacks");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteFeedbacks = createAsyncThunk(
    "feedbacks/deleteFeedbacks",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteFeedback(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting feedbacks");
        }

        return {
            message: res?.message || "Feedbacks deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const feedbacksSlice = createSlice({
    name: "feedbacks",
    initialState,
    reducers: {
        setFeedbacksPage(state, action) {
            state.page = action.payload || 1;
        },
        setFeedbacksRows(state, action) {
            state.rows = action.payload || [];
        },
        setFeedbacksLoading(state, action) {
            state.loading = action.payload;
        },
        setFeedbacksDeleting(state, action) {
            state.deleting = action.payload;
        },
        setFeedbacksPagination(state, action) {
            state.pagination = action.payload;
        },
        setFeedbacksSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearFeedbacksSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFeedbacks.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchFeedbacks.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchFeedbacks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching feedbacks";
            })
            .addCase(deleteFeedbacks.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteFeedbacks.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteFeedbacks.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting feedbacks";
            });
    }
});

export const {
    setFeedbacksPage,
    setFeedbacksRows,
    setFeedbacksLoading,
    setFeedbacksDeleting,
    setFeedbacksPagination,
    setFeedbacksSelection,
    clearFeedbacksSelection,
} = feedbacksSlice.actions;

export default feedbacksSlice.reducer;

export const selectFeedbacksRows = (state) => state.feedbacks.rows;
export const selectFeedbacksPagination = (state) => state.feedbacks.pagination;
export const selectFeedbacksPage = (state) => state.feedbacks.page;
export const selectFeedbacksLoading = (state) => state.feedbacks.loading;
export const selectFeedbacksDeleting = (state) => state.feedbacks.deleting;
export const selectFeedbacksSelectedRowIds = (state) => state.feedbacks.selectedRowIds;
export const selectFeedbacksError = (state) => state.feedbacks.error;