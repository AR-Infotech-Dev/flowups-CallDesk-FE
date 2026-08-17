import { makeRequest } from "@/api/httpClient";
import { quotationsModuleSchema } from "./module.schema";

export const getQuotationsList = ({ filterState, page }) => makeRequest(quotationsModuleSchema.api.list, {
  method: "POST",
  body: {
    status: "active",
    page,
    searchText: filterState.searchText,
    filters: filterState.filters,
    order: filterState.order,
    orderBy: filterState.order_by,
  },
});

export const deleteQuotation = (ids) => makeRequest(quotationsModuleSchema.api.delete, {
  method: "POST",
  body: { ids },
});

export const getQuotationDetails = (id) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}`, {
  method: "GET",
});

export const getQuotationPreview = (id) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/preview`, {
  method: "GET",
});

export const getQuotationHistory = (id) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/history`, {
  method: "GET",
});

export const sendQuotation = (id, recipientEmail) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/send`, {
  method: "POST",
  body: { confirmed: true, recipient_email: recipientEmail },
  timeout: 60000,
});

export const changeQuotationStatus = (id, status, remarks = "") => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/status`, {
  method: "POST",
  body: { status, remarks },
});

export const reviseQuotation = (id, reason) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/revise`, {
  method: "POST",
  body: { reason },
});

export const getQuotationFollowups = (id) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/followups`, {
  method: "GET",
});

export const scheduleQuotationFollowup = (id, data) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/followups`, {
  method: "POST",
  body: data,
});

export const completeQuotationFollowup = (id, followupId, data) => makeRequest(`${quotationsModuleSchema.api.edit}/${id}/followups/${followupId}/complete`, {
  method: "POST",
  body: data,
});

export const saveQuotation = ({ mode, quotationID, formData }) => makeRequest(
  mode === "create" ? quotationsModuleSchema.api.create : `${quotationsModuleSchema.api.edit}/${quotationID}`,
  {
    method: mode === "create" ? "PUT" : "POST",
    body: formData,
  }
);
export const getCustomerDetails = async (customerId) => {
  return await makeRequest(`customers/${customerId}`, {
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
