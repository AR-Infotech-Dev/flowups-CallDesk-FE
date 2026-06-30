import { makeRequest } from "@/api/httpClient";
import { ticketsModuleSchema } from "./module.schema";

export const getTicketsList = async ({ filterState, filters, page, viewAll }) => {
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

export const getTicketKanbanColumnPage = async ({
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

export const deleteTickets = async (selectedRowIds) => {
  return await makeRequest(ticketsModuleSchema.api.delete, {
    method: "POST",
    body: {
      action: "delete",
      ids: selectedRowIds,
    },
  });
};
