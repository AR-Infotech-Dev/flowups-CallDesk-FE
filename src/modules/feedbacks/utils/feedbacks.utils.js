import { feedbacksModuleSchema } from "../data/module.schema";

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
export function getSelectedLabel(field, value, selectedFeedback) {
  if (!value) {
    return "";
  }

  if (field.name === "roleID") {
    return selectedFeedback?.roleName || selectedFeedback?.role_name || selectedFeedback?.roleID || value;
  }

  if (field.name === "default_company") {
    return selectedFeedback?.company_name || selectedFeedback?.default_company_name || selectedFeedback?.default_company || value;
  }

  return value;
}
export function getFeedbackIdentifier(feedback = {}) {
  return feedback?.adminID;
}
export function normalizeFeedbackData(selectedFeedback = {}) {
  return {
    ...feedbacksModuleSchema.form.initialValues,
    ...selectedFeedback,
  };
}
export const generateCredentials = (name, birthDate) => {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, "");

  const dob = new Date(birthDate);
  const day = String(dob.getDate()).padStart(2, "0");
  const month = String(dob.getMonth() + 1).padStart(2, "0");
  const year = dob.getFullYear();
  const feedbackname = cleanName.split("_")[0] + "@" + year;
  const password = cleanName.charAt(0).toUpperCase() + day + month + "@" + String(year).slice(-2);

  return {
    feedbackName: feedbackname,
    password: password,
  };
};
