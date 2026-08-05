import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchFeedbacks,
    fetchReviews,
    selectFeedbacksPagination,
    selectFeedbacksPage,
    selectFeedbacksLoading,
    selectFeedbacksDeleting,
    selectFeedbacksSelectedRowIds,
    selectFeedbacksRows,
} from "../data/feedbacks.slice";
import * as feedbacksActions from "../data/feedbacks.slice";
import { useState } from "react";

export const useFeedbackModule = ({ filterState }) => {
    const dispatch = useAppDispatch();
    const selectedRowIds = useAppSelector(selectFeedbacksSelectedRowIds);
    const pagination = useAppSelector(selectFeedbacksPagination);
    const loading = useAppSelector(selectFeedbacksLoading);
    const deleting = useAppSelector(selectFeedbacksDeleting);
    const page = useAppSelector(selectFeedbacksPage);
    const feedbackList = useAppSelector(selectFeedbacksRows);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

    const getFeedbackList = async () => {
        const action = await dispatch(fetchFeedbacks({ filterState, page }));

        if (fetchFeedbacks.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching feedbacks");
        }
    };
    const getReviewRatings = async () => {
        const action = await dispatch(fetchReviews({}));

        if (fetchReviews.rejected.match(action)) {
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
    const openEditFlyout = (ticket) => {
        setSelectedTicket(ticket);
        setIsFlyoutOpen(true);
    };
    const closeFlyout = () => {
        setIsFlyoutOpen(false);
        setSelectedTicket(null);
    };
    return {
        isFlyoutOpen,
        selectedTicket,
        setIsFlyoutOpen,
        pagination,
        page,
        loading,
        deleting,
        selectedRowIds,
        handlePageChange,
        getReviewRatings,
        getFeedbackList,
        handleToggleRow,
        handleToggleAllRows,
        openEditFlyout,
        closeFlyout,
    }
}