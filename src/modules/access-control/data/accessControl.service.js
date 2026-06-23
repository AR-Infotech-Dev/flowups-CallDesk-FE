import { makeRequest } from "@/api/httpClient";

export const getAccessMenus = async () => {
  return await makeRequest("/get-menus", {
    method: "POST",
    body: {
      getAll: "Y",
    },
  });
};

export const getIdentityPermissions = async (identityId) => {
  return await makeRequest(`/permissions/${identityId}`, {
    method: "GET",
  });
};

export const saveIdentityPermissions = async ({ identity, permissions }) => {
  return await makeRequest(`/permissions/save/${identity.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      user_id: parseInt(identity.id),
      company_id: parseInt(identity.company_id),
      permissions,
    },
  });
};
