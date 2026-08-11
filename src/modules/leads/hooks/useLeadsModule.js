import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  clearLeadsSelection, deleteLeadItems, fetchLeads, selectLeadsDeleting, selectLeadsLoading,
  selectLeadsPage, selectLeadsPagination, selectLeadsRows, selectLeadsSelectedRowIds,
  setLeadsPage, setLeadsSelection,
} from "../data/leads.slice";

export const useLeadsModule = ({ filterState }) => {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectLeadsRows);
  const pagination = useAppSelector(selectLeadsPagination);
  const page = useAppSelector(selectLeadsPage);
  const loading = useAppSelector(selectLeadsLoading);
  const deleting = useAppSelector(selectLeadsDeleting);
  const selectedRowIds = useAppSelector(selectLeadsSelectedRowIds);

  const getLeadList = async () => {
    const action = await dispatch(fetchLeads({ filterState, page }));
    if (fetchLeads.rejected.match(action)) toast.error(action.payload || "Unable to fetch leads");
  };
  const handlePageChange = (value) => dispatch(setLeadsPage(value));
  const handleToggleRow = (id, checked) => dispatch(setLeadsSelection(checked ? [...new Set([...selectedRowIds, id])] : selectedRowIds.filter((item) => item !== id)));
  const handleToggleAllRows = (checked) => dispatch(checked ? setLeadsSelection(rows.map((row) => row.lead_id).filter(Boolean)) : clearLeadsSelection());
  const remove = async (ids) => {
    const action = await dispatch(deleteLeadItems(ids));
    if (deleteLeadItems.fulfilled.match(action)) { toast.success(action.payload.message); await getLeadList(); }
    else toast.error(action.payload || "Unable to delete lead");
  };
  const handleDeleteSelected = () => selectedRowIds.length ? remove(selectedRowIds) : toast.error("Please select at least one lead");
  const handleDeleteRow = (row) => {
    if (!row?.lead_id) return toast.error("Lead id not found");
    if (window.confirm("Delete this lead?")) return remove([row.lead_id]);
  };

  return { pagination, page, loading, deleting, selectedRowIds, getLeadList, handlePageChange, handleToggleRow, handleToggleAllRows, handleDeleteSelected, handleDeleteRow };
};
