import { makeRequest } from "@/api/httpClient";
import { ticketsModuleSchema } from "./module.schema";

export const getAmcticketsList = async ({ filterState, filters, page, viewAll }) => {
  return await makeRequest(ticketsModuleSchema.api.list, {
    method: "POST",
    body: {
      status: "active",
      page,
      searchText: filterState.searchText,
      filters,
      order: filterState.order,
      order_by: filterState.order_by,
      viewAll: viewAll ? "Y" : "N",
    },
  });
};

export const getAmcticketKanbanColumnPage = async ({
  columnId,
  columnPage,
  filterState,
  filters,
  viewAll,
}) => {
  return await makeRequest(ticketsModuleSchema.api.list, {
    method: "POST",
    body: {
      status: "active",
      page: columnPage,
      searchText: filterState.searchText,
      filters,
      order: filterState.order,
      order_by: filterState.order_by,
      viewAll: viewAll ? "Y" : "N",
      [ticketsModuleSchema.kanban.statusField]: columnId,
    },
  });
};

export const deleteAmctickets = async (selectedRowIds) => {
  return await makeRequest(ticketsModuleSchema.api.delete, {
    method: "POST",
    body: {
      action: "delete",
      ids: selectedRowIds,
    },
  });
};

// export const hideAmctickets = async (selectedRowIds) => {
//   return await makeRequest(amcticketsModuleSchema.api.delete, {
//     method: "POST",
//     body: {
//       action: "hide",
//       status: "inactive",
//       ids: selectedRowIds,
//     },
//   });
// };
