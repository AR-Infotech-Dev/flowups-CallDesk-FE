import { makeRequest } from "@/api/httpClient";
import { feedbacksModuleSchema } from "@modules/feedbacks/data/module.schema";

export const getFeedbacksList = async ({ filterState, page }) => {
    return await makeRequest(feedbacksModuleSchema.api.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            status: "active",
            page,
            searchText: filterState.searchText,
            filters: filterState.filters,
            order: filterState.order,
            order_by: filterState.order_by,
        },
    });
}

export const fetchReviewRatings = async (payload = {}) => {
    return await makeRequest("/review-ratings", {
        method: "POST",
        body: payload,
    });
};

export const deleteFeedback = async (selectedRowIds) => {
    return await makeRequest(feedbacksModuleSchema.api.delete, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            action: 'delete',
            ids: selectedRowIds,
        },
    });
}
export const getFeedbackDetails = async (feedbackID) => {
    return await makeRequest(
        `${feedbacksModuleSchema.api.edit}/${feedbackID}`,
        {
            method: "GET",
        }
    );
}
export const saveFeedback = async ({ mode, feedbackID, formData }) => {
    const saveUrl = mode === "create" ? feedbacksModuleSchema.api.create : `${feedbacksModuleSchema.api.edit}/${feedbackID}`;
    const method = mode === "create" ? "PUT" : "POST";

    return makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
};
