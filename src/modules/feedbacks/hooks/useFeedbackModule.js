import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchFeedbacks,
    deleteFeedbacks,
    selectFeedbacksPagination,
    selectFeedbacksPage,
    selectFeedbacksLoading,
    selectFeedbacksDeleting,
    selectFeedbacksSelectedRowIds,
    selectFeedbacksRows,
} from "../data/feedbacks.slice";
import * as feedbacksActions from "../data/feedbacks.slice";

export const useFeedbacksModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectFeedbacksSelectedRowIds);
    const pagination = useAppSelector(selectFeedbacksPagination);
    const loading = useAppSelector(selectFeedbacksLoading);
    const deleting = useAppSelector(selectFeedbacksDeleting);
    const page = useAppSelector(selectFeedbacksPage);
    const feedbackList = useAppSelector(selectFeedbacksRows);

    const getFeedbackList = async () => {
        const action = await dispatch(fetchFeedbacks({ filterState, page }));

        if (fetchFeedbacks.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching feedbacks");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(feedbacksActions.setFeedbacksPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(feedbacksActions.setFeedbacksSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(feedbacksActions.clearFeedbacksSelection());
            return;
        }

        dispatch(feedbacksActions.setFeedbacksSelection(
            feedbackList.map((row) => row?._id ?? row?.id ?? row?.adminID).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one feedback to delete.");
            return;
        }
        const action = await dispatch(deleteFeedbacks(selectedRowIds));

        if (deleteFeedbacks.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getFeedbackList();
        }
        if (deleteFeedbacks.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?._id ?? row?.id ?? row?.adminID;
        if (!rowId) { toast.error("Feedback id not found."); return; }
        if (!window.confirm("Delete this feedback?")) return;

        const action = await dispatch(deleteFeedbacks([rowId]));

        if (deleteFeedbacks.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getFeedbackList();
        }
        if (deleteFeedbacks.rejected.match(action)) {
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
        getFeedbackList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}