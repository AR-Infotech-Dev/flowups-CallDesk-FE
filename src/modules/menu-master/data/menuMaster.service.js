import { makeRequest } from "@/api/httpClient";
import { menuMasterSchema } from "./module.schema";

export const getMenuList = async ({ filterState }) => {
  return await makeRequest(menuMasterSchema.api.list, {
    method: "POST",
    body: {
      status: "active",
      getAll: "Y",
      searchText: filterState.searchText,
      filters: filterState.filters,
      order: "ASC",
      order_by: "menu_index",
    },
  });
};

export const deleteMenus = async (selectedRowIds) => {
  return await makeRequest(menuMasterSchema.api.delete, {
    method: "POST",
    body: {
      action: "delete",
      ids: selectedRowIds,
    },
  });
};

export const updateMenuPositions = async (positions) => {
  return await makeRequest("/menus/update-positions", {
    method: "POST",
    body: { positions },
  });
};

export const getMenuDetails = async (menuId) => {
  return await makeRequest(`${menuMasterSchema.api.edit}/${menuId}`, {
    method: "GET",
  });
};

export const saveMenu = async ({ mode, menuId, payload }) => {
  const saveUrl =
    mode === "create"
      ? menuMasterSchema.api.create
      : `${menuMasterSchema.api.edit}/${menuId}`;
  const method = mode === "create" ? "PUT" : "POST";

  return await makeRequest(saveUrl, {
    method,
    body: payload,
  });
};
