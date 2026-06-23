import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteProduct, getProductsList } from "./products.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> products fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected user ids
    error: "",          // -> API error message
}

export const fetchProducts = createAsyncThunk(
    "products/fetchProducts",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getProductsList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching products");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteProducts = createAsyncThunk(
    "products/deleteProducts",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteProduct(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting products");
        }

        return {
            message: res?.message || "Products deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const productsSlice = createSlice({
    name: "products",
    initialState,
    reducers: {
        setProductsPage(state, action) {
            state.page = action.payload || 1;
        },
        setProductsRows(state, action) {
            state.rows = action.payload || [];
        },
        setProductsLoading(state, action) {
            state.loading = action.payload;
        },
        setProductsDeleting(state, action) {
            state.deleting = action.payload;
        },
        setProductsPagination(state, action) {
            state.pagination = action.payload;
        },
        setProductsSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearProductsSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching products";
            })
            .addCase(deleteProducts.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteProducts.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteProducts.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting products";
            });
    }
});

export const {
    setProductsPage,
    setProductsRows,
    setProductsLoading,
    setProductsDeleting,
    setProductsPagination,
    setProductsSelection,
    clearProductsSelection,
} = productsSlice.actions;

export default productsSlice.reducer;

export const selectProductsRows = (state) => state.products.rows;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductsPage = (state) => state.products.page;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsDeleting = (state) => state.products.deleting;
export const selectProductsSelectedRowIds = (state) => state.products.selectedRowIds;
export const selectProductsError = (state) => state.products.error;