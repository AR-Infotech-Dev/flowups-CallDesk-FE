import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchQuotations,
    deleteQuotations,
    selectQuotationsPagination,
    selectQuotationsPage,
    selectQuotationsLoading,
    selectQuotationsDeleting,
    selectQuotationsSelectedRowIds,
    selectQuotationsRows,
} from "../data/quotations.slice";
import * as quotationsActions from "../data/quotations.slice";
import { customerModuleSchema } from "@/modules/customer/data/module.schema";

export const useQuotationsModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectQuotationsSelectedRowIds);
    const pagination = useAppSelector(selectQuotationsPagination);
    const loading = useAppSelector(selectQuotationsLoading);
    const deleting = useAppSelector(selectQuotationsDeleting);
    const page = useAppSelector(selectQuotationsPage);
    const quotationList = useAppSelector(selectQuotationsRows);

    const getQuotationList = async () => {
        const action = await dispatch(fetchQuotations({ filterState, page }));

        if (fetchQuotations.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching quotations");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(quotationsActions.setQuotationsPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(quotationsActions.setQuotationsSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(quotationsActions.clearQuotationsSelection());
            return;
        }

        dispatch(quotationsActions.setQuotationsSelection(
            quotationList.map((row) => row?.quotation_id).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one quotation to delete.");
            return;
        }
        const action = await dispatch(deleteQuotations(selectedRowIds));

        if (deleteQuotations.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getQuotationList();
        }
        if (deleteQuotations.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?.quotation_id;
        if (!rowId) { toast.error("Quotation id not found."); return; }
        if (!window.confirm("Delete this quotation?")) return;

        const action = await dispatch(deleteQuotations([rowId]));

        if (deleteQuotations.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getQuotationList();
        }
        if (deleteQuotations.rejected.match(action)) {
            toast.error(action.payload);
        }
    };
    
    return {
        pagination,
        page,
        loading,
        deleting,
        selectedRowIds,
        handlePageChange,
        getQuotationList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}
