import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchSubscriptions,
    deleteSubscriptions,
    selectSubscriptionsPagination,
    selectSubscriptionsPage,
    selectSubscriptionsLoading,
    selectSubscriptionsDeleting,
    selectSubscriptionsSelectedRowIds,
    selectSubscriptionsRows,
} from "../data/subscriptions.slice";
import * as subscriptionsActions from "../data/subscriptions.slice";

export const useSubscriptionsModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectSubscriptionsSelectedRowIds);
    const pagination = useAppSelector(selectSubscriptionsPagination);
    const loading = useAppSelector(selectSubscriptionsLoading);
    const deleting = useAppSelector(selectSubscriptionsDeleting);
    const page = useAppSelector(selectSubscriptionsPage);
    const subscriptionList = useAppSelector(selectSubscriptionsRows);

    const getSubscriptionList = async () => {
        const action = await dispatch(fetchSubscriptions({ filterState, page }));

        if (fetchSubscriptions.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching subscriptions");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(subscriptionsActions.setSubscriptionsPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(subscriptionsActions.setSubscriptionsSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(subscriptionsActions.clearSubscriptionsSelection());
            return;
        }

        dispatch(subscriptionsActions.setSubscriptionsSelection(
            subscriptionList.map((row) => row?._id ?? row?.id ?? row?.adminID).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one subscription to delete.");
            return;
        }
        const action = await dispatch(deleteSubscriptions(selectedRowIds));

        if (deleteSubscriptions.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getSubscriptionList();
        }
        if (deleteSubscriptions.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?._id ?? row?.id ?? row?.adminID;
        if (!rowId) { toast.error("Subscription id not found."); return; }
        if (!window.confirm("Delete this subscription?")) return;

        const action = await dispatch(deleteSubscriptions([rowId]));

        if (deleteSubscriptions.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getSubscriptionList();
        }
        if (deleteSubscriptions.rejected.match(action)) {
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
        getSubscriptionList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}