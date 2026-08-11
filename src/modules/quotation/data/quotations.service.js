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
