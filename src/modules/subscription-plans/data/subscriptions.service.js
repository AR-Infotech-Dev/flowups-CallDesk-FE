import { makeRequest } from "@/api/httpClient";
import { subscriptionsModuleSchema } from "@modules/subscription-plans/data/module.schema";

export const getSubscriptionsList = async ({ filterState, page }) => {
    return await makeRequest(subscriptionsModuleSchema.api.list, {
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
export const deleteSubscription = async (selectedRowIds) => {
    return await makeRequest(subscriptionsModuleSchema.api.delete, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            action: 'delete',
            ids: selectedRowIds,
        },
    });
}
export const getSubscriptionDetails = async (subscriptionID) => {
    return await makeRequest(
        `${subscriptionsModuleSchema.api.edit}/${subscriptionID}`,
        {
            method: "GET",
        }
    );
}
export const saveSubscription = async ({ mode, subscriptionID, formData }) => {
    const saveUrl = mode === "create" ? subscriptionsModuleSchema.api.create : `${subscriptionsModuleSchema.api.edit}/${subscriptionID}`;
    const method = mode === "create" ? "PUT" : "POST";

    return makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
};
