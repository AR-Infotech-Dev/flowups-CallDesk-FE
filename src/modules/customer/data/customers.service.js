import { makeRequest } from "@/api/httpClient";
import { customerModuleSchema } from "./module.schema";

export const getCustomersList = async ({ filterState, page }) => {
    return await makeRequest(customerModuleSchema.api.list, {
        method: "POST",
        body: {
            page,
            searchText: filterState.searchText,
            filters: filterState.filters,
            order: filterState.order,
            order_by: filterState.order_by,
        },
    });
}
export const deleteCustomers = async (selectedRowIds) => {
    return await makeRequest(customerModuleSchema.api.delete, {
        method: "POST",
        body: {
            action: "delete",
            ids: selectedRowIds,
        },
    });
}

export const getCustomerDetails = async (customerId) => {
    return await makeRequest(`${customerModuleSchema.api.edit}/${customerId}`, {
        method: "GET",
    });
}

export const getCustomerProductOptions = async () => {
    return await makeRequest("/system/searchList", {
        method: "POST",
        body: {
            text: "",
            system: "new",
            tableName: "products",
            wherec: "product_name",
            status: false,
            list: "product_id,product_name",
            isCompanyWise: true,
            curpage: 0,
        },
    });
}

export const saveCustomer = async ({ mode, customerId, payload }) => {
    const saveUrl = mode === "create" ? customerModuleSchema.api.create : `${customerModuleSchema.api.edit}/${customerId}`;
    const method = mode === "create" ? "PUT" : "POST";

    return await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export const downloadExcel = async ({ filterState, selectedColumns = [], skipColumns = [] }) => {
    return await makeRequest(customerModuleSchema.api.downloadExcel, {
        method: "POST",
        body: {
            searchText: filterState.searchText,
            filters: filterState.filters,
            order: filterState.order,
            order_by: filterState.order_by,
            selectedColumns,
            skipColumns,
        },
        responseType: "blob",
        timeout: 30000,
    });
}

export const downloadCustomerImportTemplate = async () => makeRequest(customerModuleSchema.api.importTemplate, {
    method: "GET",
    responseType: "blob",
    timeout: 30000,
});

export const importCustomerWorkbook = async ({ file, mode = "preview", onUploadProgress }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    return makeRequest(customerModuleSchema.api.import, {
        method: "POST",
        body: formData,
        timeout: 300000,
        onUploadProgress,
    });
};
