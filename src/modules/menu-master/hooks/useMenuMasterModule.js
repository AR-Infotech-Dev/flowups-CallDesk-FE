import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  deleteMenuItems,
  fetchMenus,
  saveMenuSequence,
  selectMenuMasterDeleting,
  selectMenuMasterLoading,
  selectMenuMasterRows,
  selectMenuMasterSavingSequence,
  selectMenuMasterSequenceDirty,
  setMenuMasterRows,
} from "../data/menuMaster.slice";
import { getMenuIdentifier } from "../utils/menuMaster.utils";

export const useMenuMasterModule = ({ filterState }) => {
  const dispatch = useAppDispatch();

  const menuList = useAppSelector(selectMenuMasterRows);
  const loading = useAppSelector(selectMenuMasterLoading);
  const deleting = useAppSelector(selectMenuMasterDeleting);
  const savingSequence = useAppSelector(selectMenuMasterSavingSequence);
  const sequenceDirty = useAppSelector(selectMenuMasterSequenceDirty);

  const getMenus = async () => {
    const action = await dispatch(fetchMenus({ filterState }));

    if (fetchMenus.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching menus");
    }
  };

  const handleDeleteMenu = async (menu) => {
    const menuId = getMenuIdentifier(menu);

    if (!menuId) {
      toast.error("Menu id not found.");
      return;
    }

    const action = await dispatch(deleteMenuItems([menuId]));

    if (deleteMenuItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Menus deleted successfully.");
      await getMenus();
      return;
    }

    toast.error(action.payload || "Error while deleting menus");
  };

  const handleSortChange = (nextRows) => {
    dispatch(setMenuMasterRows(nextRows));
  };

  const handleSaveSequence = async () => {
    const action = await dispatch(saveMenuSequence(menuList));

    if (saveMenuSequence.fulfilled.match(action)) {
      toast.success(action.payload || "Menu sequence saved.");
      await getMenus();
      return;
    }

    toast.error(action.payload || "Unable to save menu sequence.");
  };

  return {
    menuList,
    loading,
    deleting,
    savingSequence,
    sequenceDirty,
    getMenus,
    handleDeleteMenu,
    handleSortChange,
    handleSaveSequence,
  };
};
