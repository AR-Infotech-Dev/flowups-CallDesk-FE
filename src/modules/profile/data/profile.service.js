import { makeRequest } from "@/api/httpClient";

export const getProfile = async () => {
  return await makeRequest("/users/profile", {
    method: "GET",
  });
};

export const updateProfile = async (payload) => {
  return await makeRequest("/users/profile", {
    method: "POST",
    body: payload,
  });
};

export const changeProfilePassword = async (payload) => {
  return await makeRequest("/users/profile/change-password", {
    method: "POST",
    body: payload,
  });
};
