import { makeRequest } from "@/api/httpClient";
import { usersModuleSchema } from "@modules/users/data/module.schema";

export const getUsersList = async ({ filterState, page }) => {
    return await makeRequest(usersModuleSchema.api.list, {
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
export const deleteUser = async (selectedRowIds) => {
    return await makeRequest(usersModuleSchema.api.delete, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            action: 'delete',
            ids: selectedRowIds,
        },
    });
}
export const getUserDetails = async (userID) => {
    return await makeRequest(
        `${usersModuleSchema.api.edit}/${userID}`,
        {
            method: "GET",
        }
    );
}
export const saveUser = async ({ mode, userID, formData }) => {
    const saveUrl = mode === "create" ? usersModuleSchema.api.create : `${usersModuleSchema.api.edit}/${userID}`;
    const method = mode === "create" ? "PUT" : "POST";

    return makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
};
