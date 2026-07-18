import { subscriptionsModuleSchema } from "../data/module.schema";

export function buildJoinedOptions(joinConfig, selectedValue, selectedLabel) {
  const configuredOptions = (joinConfig?.options || []).map((option) => ({
    value: option.value ?? option[joinConfig.primaryKey],
    label: option.label ?? option[joinConfig.labelKey],
  }));

  if (selectedValue && !configuredOptions.some((option) => String(option.value) === String(selectedValue))) {
    return [
      ...configuredOptions,
      {
        value: selectedValue,
        label: selectedLabel || selectedValue,
      },
    ];
  }

  return configuredOptions;
}
export function getSelectedLabel(field, value, selectedSubscription) {
  if (!value) {
    return "";
  }

  if (field.name === "roleID") {
    return selectedSubscription?.roleName || selectedSubscription?.role_name || selectedSubscription?.roleID || value;
  }

  if (field.name === "default_company") {
    return selectedSubscription?.company_name || selectedSubscription?.default_company_name || selectedSubscription?.default_company || value;
  }

  return value;
}
export function getSubscriptionIdentifier(subscription = {}) {
  return subscription?.adminID;
}
export function normalizeSubscriptionData(selectedSubscription = {}) {
  return {
    ...subscriptionsModuleSchema.form.initialValues,
    ...selectedSubscription,
    subscriptionName: selectedSubscription?.subscriptionName || selectedSubscription?.subscription_name || "",
    contactNo: selectedSubscription?.contactNo || selectedSubscription?.contactno || "",
    whatsappNo: selectedSubscription?.whatsappNo || selectedSubscription?.whatsappno || "",
    // dateOfBirth: selectedSubscription?.dateOfBirth || selectedSubscription?.dateofbirth || "",
    roleID: selectedSubscription?.roleID || selectedSubscription?.roleid || selectedSubscription?.roleId || "",
    default_company: selectedSubscription?.default_company || selectedSubscription?.company_id || "",
    is_approver: selectedSubscription?.is_approver || "no",
    time_zone: selectedSubscription?.time_zone || "Asia/Kolkata",
    google_location: selectedSubscription?.google_location || "",
    address: selectedSubscription?.address || "",
    status: selectedSubscription?.status || "active",
    dateOfBirth: selectedSubscription?.dateOfBirth
      ? new Date(selectedSubscription.dateOfBirth).toISOString().split("T")[0]
      : "",
  };
}
export const generateCredentials = (name, birthDate) => {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, "");

  const dob = new Date(birthDate);
  const day = String(dob.getDate()).padStart(2, "0");
  const month = String(dob.getMonth() + 1).padStart(2, "0");
  const year = dob.getFullYear();
  const subscriptionname = cleanName.split("_")[0] + "@" + year;
  const password = cleanName.charAt(0).toUpperCase() + day + month + "@" + String(year).slice(-2);

  return {
    subscriptionName: subscriptionname,
    password: password,
  };
};
