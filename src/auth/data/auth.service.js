import { makeRequest } from "../../api/httpClient";

export const getSalt = async () => {
    return await makeRequest("/salt", {
        method: "GET",
    });
}

export const getlogin = async ({ username = "", encryptedPassword = "" }) => {
    return await makeRequest("login", {
        method: "POST",
        body: {
            username,
            encryptedPassword,
        }
    });
}

export const getOtp = async ({ email = "" }) => {
    return await makeRequest("forgotPassword", {
        method: "POST",
        body: { email },
    });
}
export const verifyOtp = async ({ otp = "", newPassword = "", confirmPassword = "" }) => {
    return await makeRequest("verifyOtp", {
        method: "POST",
        body: {
            otp,
            new_password: newPassword,
            re_enter_password: confirmPassword,
        },
    });
}
export const getPermissions = async (userId) => {
    return await makeRequest(`/get-permissions/${userId}`, {
        method: "GET",
    });
}
export const getMenus = async () => {
    return await makeRequest("/get-menus", {
        method: "POST",
        body: { getAll: "Y" },
    });
}
