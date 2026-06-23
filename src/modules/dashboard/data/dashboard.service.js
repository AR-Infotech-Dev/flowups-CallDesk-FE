import { makeRequest } from "@api/httpClient";

export const getDashboard = async (dashboardFilter) => {
    return await makeRequest("/dashboard", {
        method: "POST",
        body: dashboardFilter
    });
}
export const getProduct = async (customer_id) => {
    return await makeRequest(`/customers/${customer_id}`, {
        method: "GET",
    });
}
export const updateProductExpiry = async (customer_id, payload) => {
    return await makeRequest(`/customers/${customer_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}