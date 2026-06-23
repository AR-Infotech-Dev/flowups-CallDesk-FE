import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteCustomers, getCustomersList } from "./customers.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> users fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected user ids
    error: "",          // -> API error message
}

export const fetchCustomers = createAsyncThunk(
    "customers/fetchCustomers",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getCustomersList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching customers");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteCustomer = createAsyncThunk(
    "customers/deleteCustomers",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteCustomers(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting customer");
        }

        return {
            message: res?.message || "Customer deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const customersSlice = createSlice({
    name: "customers",
    initialState,
    reducers: {
        setCustomersPage(state, action) {
            state.page = action.payload || 1;
        },
        setCustomersRows(state, action) {
            state.rows = action.payload || [];
        },
        setCustomersLoading(state, action) {
            state.loading = action.payload;
        },
        setCustomersDeleting(state, action) {
            state.deleting = action.payload;
        },
        setCustomersPagination(state, action) {
            state.pagination = action.payload;
        },
        setCustomersSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearCustomersSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching customers";
            })
            .addCase(deleteCustomer.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteCustomer.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteCustomer.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting customers";
            });
    }
});

export const {
    setCustomersPage,
    setCustomersRows,
    setCustomersLoading,
    setCustomersDeleting,
    setCustomersPagination,
    setCustomersSelection,
    clearCustomersSelection,
} = customersSlice.actions;

export default customersSlice.reducer;

export const selectCustomersRows = (state) => state.customers.rows;
export const selectCustomersPagination = (state) => state.customers.pagination;
export const selectCustomersPage = (state) => state.customers.page;
export const selectCustomersLoading = (state) => state.customers.loading;
export const selectCustomersDeleting = (state) => state.customers.deleting;
export const selectCustomersSelectedRowIds = (state) => state.customers.selectedRowIds;
export const selectCustomersError = (state) => state.customers.error;
