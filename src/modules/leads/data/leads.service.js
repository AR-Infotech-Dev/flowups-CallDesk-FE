import { makeRequest } from "@/api/httpClient";
import { leadsModuleSchema } from "./module.schema";

export const getLeadsList = ({ filterState, page }) => makeRequest(leadsModuleSchema.api.list, {
  method: "POST",
  body: {
    page,
    searchText: filterState.searchText,
    filters: filterState.filters,
    order: filterState.order,
    order_by: filterState.order_by,
  },
});

export const getLeadDetails = (leadId) => makeRequest(`${leadsModuleSchema.api.edit}/${leadId}`, { method: "GET" });

export const saveLead = ({ mode, leadId, payload }) => makeRequest(
  mode === "create" ? leadsModuleSchema.api.create : `${leadsModuleSchema.api.edit}/${leadId}`,
  {
    method: mode === "create" ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }
);

export const deleteLeads = (ids) => makeRequest(leadsModuleSchema.api.delete, {
  method: "POST",
  body: { ids },
});
