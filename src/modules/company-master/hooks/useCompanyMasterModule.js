import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  clearCompanyMasterSelection,
  deleteCompanyItems,
  fetchCompanies,
  selectCompanyMasterDeleting,
  selectCompanyMasterLoading,
  selectCompanyMasterPage,
  selectCompanyMasterPagination,
  selectCompanyMasterRows,
  selectCompanyMasterSelectedRowIds,
  setCompanyMasterPage,
  setCompanyMasterSelection,
} from "../data/companyMaster.slice";
import { getCompanyIdentifier } from "../utils/companyMaster.utils";
import { exportCompanyDb } from "../data/companyMaster.service";

export const useCompanyMasterModule = ({ filterState }) => {
  const dispatch = useAppDispatch();

  const companyList = useAppSelector(selectCompanyMasterRows);
  const pagination = useAppSelector(selectCompanyMasterPagination);
  const page = useAppSelector(selectCompanyMasterPage);
  const loading = useAppSelector(selectCompanyMasterLoading);
  const deleting = useAppSelector(selectCompanyMasterDeleting);
  const selectedRowIds = useAppSelector(selectCompanyMasterSelectedRowIds);

  const getCompanies = async () => {
    const action = await dispatch(fetchCompanies({ filterState, page }));

    if (fetchCompanies.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching companies");
    }
  };

  const handlePageChange = (nextPage) => {
    dispatch(setCompanyMasterPage(nextPage));
  };

  const handleToggleRow = (rowId, checked) => {
    const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
    const nextSelectedRowIds = checked
      ? [...new Set([...currentSelectedRowIds, rowId])]
      : currentSelectedRowIds.filter((item) => item !== rowId);

    dispatch(setCompanyMasterSelection(nextSelectedRowIds));
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      dispatch(clearCompanyMasterSelection());
      return;
    }

    dispatch(setCompanyMasterSelection(
      companyList.map((row) => getCompanyIdentifier(row) ?? row?.id).filter(Boolean)
    ));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one company.");
      return;
    }

    const action = await dispatch(deleteCompanyItems(selectedRowIds));

    if (deleteCompanyItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Companies deleted successfully.");
      await getCompanies();
      return;
    }

    toast.error(action.payload || "Error while deleting companies");
  };

  const handleDeleteRow = async (row) => {
    const rowId = getCompanyIdentifier(row) ?? row?.id;
    if (!rowId) {
      toast.error("Company id not found.");
      return;
    }

    if (!window.confirm("Delete this company?")) return;

    const action = await dispatch(deleteCompanyItems([rowId]));

    if (deleteCompanyItems.fulfilled.match(action)) {
      toast.success(action.payload?.message || "Company deleted successfully.");
      await getCompanies();
      return;
    }

    toast.error(action.payload || "Error while deleting company");
  };
  const handleDBExport = async (row) => {
    await exportCompanyDb(row);
  };

  return {
    companyList,
    pagination,
    page,
    loading,
    deleting,
    selectedRowIds,
    handlePageChange,
    getCompanies,
    handleToggleRow,
    handleToggleAllRows,
    handleDeleteSelected,
    handleDeleteRow,
    handleDBExport
  };

};
