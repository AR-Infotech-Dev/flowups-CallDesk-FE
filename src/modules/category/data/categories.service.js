import { makeRequest } from "@/api/httpClient";
import { categoryModuleSchema } from "./module.schema";

export const getCategoriesList = async ({ filterState, page }) => {
  return await makeRequest(categoryModuleSchema.api.list, {
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
};

export const deleteCategories = async (selectedRowIds) => {
  return await makeRequest(categoryModuleSchema.api.delete, {
    method: "POST",
    body: {
      action: "delete",
      ids: selectedRowIds,
    },
  });
};

export const getCategoryDetails = async (categoryId) => {
  return await makeRequest(`${categoryModuleSchema.api.edit}/${categoryId}`, {
    method: "GET",
  });
};

export const saveCategory = async ({ mode, categoryId, payload }) => {
  const saveUrl =
    mode === "create"
      ? categoryModuleSchema.api.create
      : `${categoryModuleSchema.api.edit}/${categoryId}`;
  const method = mode === "create" ? "PUT" : "POST";

  return await makeRequest(saveUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};
export const updateChildrenOrder = async (payload) => {
    return makeRequest("/categories/reorder", {
        method: "POST",
        body: payload,
    });
};

export const changeCategoryPosition = async ({
    parent_id,
    menu_ids,
}) => {
    return makeRequest("/categories/change-position", {
        method: "POST",
        body: {
            action: "changePositions",
            parent_id,
            menu_ids,
        },
    });
};
