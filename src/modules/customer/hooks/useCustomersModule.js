import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchCustomers,
    deleteCustomer,
    selectCustomersPagination,
    selectCustomersPage,
    selectCustomersLoading,
    selectCustomersDeleting,
    selectCustomersSelectedRowIds,
    selectCustomersRows,
} from "../data/customer.slice";
import * as customersActions from "../data/customer.slice";

export const useCustomersModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectCustomersSelectedRowIds);
    const pagination = useAppSelector(selectCustomersPagination);
    const loading = useAppSelector(selectCustomersLoading);
    const deleting = useAppSelector(selectCustomersDeleting);
    const page = useAppSelector(selectCustomersPage);
    const customersList = useAppSelector(selectCustomersRows);

    const getCustomersList = async () => {
        const action = await dispatch(fetchCustomers({ filterState, page }));

        if (fetchCustomers.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching customers");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(customersActions.setCustomersPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(customersActions.setCustomersSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(customersActions.clearCustomersSelection());
            return;
        }

        dispatch(customersActions.setCustomersSelection(
            customersList.map((row) => row?.customer_id ?? row?._id ?? row?.id).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one customer to delete.");
            return;
        }
        const action = await dispatch(deleteCustomer(selectedRowIds));

        if (deleteCustomer.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getCustomersList();
        }
        if (deleteCustomer.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?.customer_id ?? row?._id ?? row?.id;
        if (!rowId) { toast.error("Customer id not found."); return; }
        if (!window.confirm("Delete this Customer?")) return;

        const action = await dispatch(deleteCustomer([rowId]));

        if (deleteCustomer.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getCustomersList();
        }
        if (deleteCustomer.rejected.match(action)) {
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
        getCustomersList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}
