import { makeRequest } from "@/api/httpClient";
import { productsModuleSchema } from "./module.schema";

export const getProductsList = async ({ page, filterState }) => {
    return await makeRequest(productsModuleSchema.api.list, {
        method: "POST",
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

export const deleteProduct = async (selectedRowIds) => {
    return await makeRequest(productsModuleSchema.api.delete, {
        method: "POST",
        body: {
            action: "delete",
            ids: selectedRowIds,
        },
    });
}

export const getProductDetails = async (productId) => {
    return await makeRequest(`${productsModuleSchema.api.edit}/${productId}`, {
        method: "GET",
    });
}

export const saveProduct = async ({ mode, productId, payload }) => {
    const saveUrl =
        mode === "create"
            ? productsModuleSchema.api.create
            : `${productsModuleSchema.api.edit}/${productId}`;
    const method = mode === "create" ? "PUT" : "POST";

    return await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}
