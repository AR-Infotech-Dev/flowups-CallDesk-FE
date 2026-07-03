import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  clearCategoriesSelection,
  deleteCategoryItems,
  fetchCategories,
  selectCategoriesDeleting,
  selectCategoriesLoading,
  selectCategoriesPage,
  selectCategoriesPagination,
  selectCategoriesRows,
  selectCategoriesSelectedRowIds,
  setCategoriesPage,
  setCategoriesSelection,
} from "../data/categories.slice";

export const useCategoriesModule = ({ filterState }) => {
  const dispatch = useAppDispatch();

  const categoryList = useAppSelector(selectCategoriesRows);
  const pagination = useAppSelector(selectCategoriesPagination);
  const page = useAppSelector(selectCategoriesPage);
  const loading = useAppSelector(selectCategoriesLoading);
  const deleting = useAppSelector(selectCategoriesDeleting);
  const selectedRowIds = useAppSelector(selectCategoriesSelectedRowIds);

  const getCategoryList = async () => {
    const action = await dispatch(fetchCategories({ filterState, page }));

    if (fetchCategories.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching categories");
    }
  };

  const handlePageChange = (nextPage) => {
    dispatch(setCategoriesPage(nextPage));
  };

  const handleToggleRow = (rowId, checked) => {
    const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
    const nextSelectedRowIds = checked
      ? [...new Set([...currentSelectedRowIds, rowId])]
      : currentSelectedRowIds.filter((item) => item !== rowId);
    dispatch(setCategoriesSelection(nextSelectedRowIds));
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      dispatch(clearCategoriesSelection());
      return;
    }

    dispatch(setCategoriesSelection(
      categoryList.map((row) => row?.category_id).filter(Boolean)
    ));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one category.");
      return;
    }

    const action = await dispatch(deleteCategoryItems(selectedRowIds));

    if (deleteCategoryItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Categories deleted successfully.");
      await getCategoryList();
      return;
    }

    toast.error(action.payload || "Error while deleting categories");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?.category_id ?? row?._id ?? row?.id;
    if (!rowId) {
      toast.error("Category id not found.");
      return;
    }

    if (!window.confirm("Delete this category?")) return;

    const action = await dispatch(deleteCategoryItems([rowId]));

    if (deleteCategoryItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Category deleted successfully.");
      await getCategoryList();
      return;
    }

    toast.error(action.payload || "Error while deleting category");
  };

  return {
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    handlePageChange,
    getCategoryList,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
  };
};
