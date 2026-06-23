import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteMenus, getMenuList, updateMenuPositions } from "./menuMaster.service";

const initialState = {
  rows: [],
  loading: false,
  deleting: false,
  savingSequence: false,
  sequenceDirty: false,
  error: "",
};

export const fetchMenus = createAsyncThunk(
  "menuMaster/fetchMenus",
  async ({ filterState }, { rejectWithValue }) => {
    const res = await getMenuList({ filterState });

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while fetching menus");
    }

    return res.data || [];
  }
);

export const deleteMenuItems = createAsyncThunk(
  "menuMaster/deleteMenuItems",
  async (selectedRowIds, { rejectWithValue }) => {
    const res = await deleteMenus(selectedRowIds);

    if (!res.success) {
      return rejectWithValue(res?.message || "Error while deleting menus");
    }

    return {
      message: res?.message || "Menus deleted successfully.",
      deletedIds: selectedRowIds,
    };
  }
);

export const saveMenuSequence = createAsyncThunk(
  "menuMaster/saveMenuSequence",
  async (rows, { rejectWithValue }) => {
    const positions = rows
      .map((menu, index) => ({
        menu_id: menu?.menu_id,
        menu_index: index + 1,
      }))
      .filter((item) => item.menu_id);

    if (!positions.length) {
      return rejectWithValue("No menu sequence found to save.");
    }

    const res = await updateMenuPositions(positions);

    if (!res.success) {
      return rejectWithValue(res?.message || "Unable to save menu sequence.");
    }

    return res?.message || "Menu sequence saved.";
  }
);

const menuMasterSlice = createSlice({
  name: "menuMaster",
  initialState,
  reducers: {
    setMenuMasterRows(state, action) {
      state.rows = Array.isArray(action.payload) ? action.payload : [];
      state.sequenceDirty = true;
    },
    clearMenuSequenceDirty(state) {
      state.sequenceDirty = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenus.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
        state.sequenceDirty = false;
      })
      .addCase(fetchMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error while fetching menus";
      })
      .addCase(deleteMenuItems.pending, (state) => {
        state.deleting = true;
        state.error = "";
      })
      .addCase(deleteMenuItems.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteMenuItems.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Error while deleting menus";
      })
      .addCase(saveMenuSequence.pending, (state) => {
        state.savingSequence = true;
        state.error = "";
      })
      .addCase(saveMenuSequence.fulfilled, (state) => {
        state.savingSequence = false;
        state.sequenceDirty = false;
      })
      .addCase(saveMenuSequence.rejected, (state, action) => {
        state.savingSequence = false;
        state.error = action.payload || "Unable to save menu sequence.";
      });
  },
});

export const { clearMenuSequenceDirty, setMenuMasterRows } = menuMasterSlice.actions;

export const selectMenuMasterRows = (state) => state.menuMaster.rows;
export const selectMenuMasterLoading = (state) => state.menuMaster.loading;
export const selectMenuMasterDeleting = (state) => state.menuMaster.deleting;
export const selectMenuMasterSavingSequence = (state) => state.menuMaster.savingSequence;
export const selectMenuMasterSequenceDirty = (state) => state.menuMaster.sequenceDirty;
export const selectMenuMasterError = (state) => state.menuMaster.error;

export default menuMasterSlice.reducer;
