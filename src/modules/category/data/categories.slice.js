import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteCategories, getCategoriesList } from "./categories.service";

const initialState = {
  rows: [],
  pagination: {},
  page: 1,
  loading: false,
  deleting: false,
  selectedRowIds: [],
  error: "",
};

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async ({ filterState, page }, { rejectWithValue }) => {
    const res = await getCategoriesList({ filterState, page });

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while fetching categories");
    }

    return {
      rows: res.data || [],
      pagination: res.pagination || {},
    };
  }
);

export const deleteCategoryItems = createAsyncThunk(
  "categories/deleteCategoryItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await deleteCategories(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while deleting categories");
    }

    return {
      message: res?.message || "Categories deleted successfully",
      deletedIds: selectedRowIds,
    };
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategoriesPage(state, action) {
      state.page = action.payload || 1;
    },
    setCategoriesSelection(state, action) {
      state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearCategoriesSelection(state) {
      state.selectedRowIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.pagination = action.payload.pagination;
        state.selectedRowIds = [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching categories";
      })
      .addCase(deleteCategoryItems.pending, (state) => {
        state.deleting = true;
        state.error = "";
      })
      .addCase(deleteCategoryItems.fulfilled, (state) => {
        state.deleting = false;
        state.selectedRowIds = [];
      })
      .addCase(deleteCategoryItems.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Error while deleting categories";
      });
  },
});

export const {
  clearCategoriesSelection,
  setCategoriesPage,
  setCategoriesSelection,
} = categoriesSlice.actions;

export const selectCategoriesRows = (state) => state.categories.rows;
export const selectCategoriesPagination = (state) => state.categories.pagination;
export const selectCategoriesPage = (state) => state.categories.page;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoriesDeleting = (state) => state.categories.deleting;
export const selectCategoriesSelectedRowIds = (state) => state.categories.selectedRowIds;
export const selectCategoriesError = (state) => state.categories.error;

export default categoriesSlice.reducer;
