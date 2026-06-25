import { makeRequest } from "@/api/httpClient";
import { customerModuleSchema } from "@modules/customer/data/module.schema";
import { ticketsModuleSchema } from "./module.schema";

export const getTicketDetails = async (ticketId) => {
  return await makeRequest(`${ticketsModuleSchema.api.edit}/${ticketId}`, {
    method: "GET",
  });
};

export const getTicketWorkLogs = async (ticketId) => {
  return await makeRequest("tickets/work-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_id: ticketId }),
  });
};

export const getCustomerDetailsForTicket = async (customerId) => {
  return await makeRequest(`${customerModuleSchema.api.edit}/${customerId}`, {
    method: "GET",
  });
};

export const searchCustomerByName = async (name) => {
  return await makeRequest("/system/searchList", {
    method: "POST",
    body: JSON.stringify({
      text: name,
      system: "new",
      tableName: "customer",
      wherec: "name",
      list: "customer_id,name,created_date,mobile_no,email,contact_person",
      curpage: 0,
    }),
  });
};

export const saveTicket = async ({ mode, ticketId, payload }) => {
  const saveUrl =
    mode === "create"
      ? ticketsModuleSchema.api.create
      : `${ticketsModuleSchema.api.edit}/${ticketId}`;
  const method = mode === "create" ? "PUT" : "POST";

  return await makeRequest(saveUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      product_add_ons: JSON.stringify(payload.product_add_ons ? [payload.product_add_ons] : []),
    }),
  });
};
