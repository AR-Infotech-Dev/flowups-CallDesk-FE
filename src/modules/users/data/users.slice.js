import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteUser, getUsersList } from "./users.service";

const initialState = {
    rows: [],           // -> list
    pagination: {},     // -> API pagination info
    page: 1,            // -> current page
    loading: false,     // -> users fetch चालू आहे का
    deleting: false,    // -> delete चालू आहे का
    selectedRowIds: [], // -> selected user ids
    error: "",          // -> API error message
}

export const fetchUsers = createAsyncThunk(
    "users/fetchUsers",
    async ({ filterState, page }, { rejectWithValue }) => {
        const res = await getUsersList({ filterState, page });

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while fetching users");
        }

        return {
            rows: res.data || [],
            pagination: res.pagination || {},
        };
    }
);
export const deleteUsers = createAsyncThunk(
    "users/deleteUsers",
    async (selectedRowIds, { rejectWithValue }) => {
        const res = await deleteUser(selectedRowIds);

        if (!res.success) {
            return rejectWithValue(res?.message || "Error while deleting users");
        }

        return {
            message: res?.message || "Users deleted successfully",
            deletedIds: selectedRowIds,
        };
    }
);

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        setUsersPage(state, action) {
            state.page = action.payload || 1;
        },
        setUsersRows(state, action) {
            state.rows = action.payload || [];
        },
        setUsersLoading(state, action) {
            state.loading = action.payload;
        },
        setUsersDeleting(state, action) {
            state.deleting = action.payload;
        },
        setUsersPagination(state, action) {
            state.pagination = action.payload;
        },
        setUsersSelection(state, action) {
            state.selectedRowIds = Array.isArray(action.payload) ? action.payload : [];
        },
        clearUsersSelection(state) {
            state.selectedRowIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = "";
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.rows;
                state.pagination = action.payload.pagination;
                state.selectedRowIds = [];
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Error while fetching users";
            })
            .addCase(deleteUsers.pending, (state) => {
                state.deleting = true;
                state.error = "";
            })
            .addCase(deleteUsers.fulfilled, (state, action) => {
                state.deleting = false;
                state.selectedRowIds = [];
            })
            .addCase(deleteUsers.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload || "Error while deleting users";
            });
    }
});

export const {
    setUsersPage,
    setUsersRows,
    setUsersLoading,
    setUsersDeleting,
    setUsersPagination,
    setUsersSelection,
    clearUsersSelection,
} = usersSlice.actions;

export default usersSlice.reducer;

export const selectUsersRows = (state) => state.users.rows;
export const selectUsersPagination = (state) => state.users.pagination;
export const selectUsersPage = (state) => state.users.page;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersDeleting = (state) => state.users.deleting;
export const selectUsersSelectedRowIds = (state) => state.users.selectedRowIds;
export const selectUsersError = (state) => state.users.error;