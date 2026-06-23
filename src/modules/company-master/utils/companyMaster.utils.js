import { API_SERVER_URL } from "@/api/config";
import { companyMasterSchema } from "../data/module.schema";

export const MAIL_PROVIDER_DEFAULTS = {
  gmail: { smtp_host: "smtp.gmail.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  yahoo: { smtp_host: "smtp.mail.yahoo.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  outlook: { smtp_host: "smtp.office365.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  custom: { smtp_host: "", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
};

export const getCompanyIdentifier = (company = {}) => company?.company_id;

export const getLogoUrl = (logo = "") => {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  return `${API_SERVER_URL}${String(logo).startsWith("/") ? logo : `/${logo}`}`;
};

export const getLogoPathFromResponse = (response = {}) =>
  response?.data?.email_logo ||
  response?.data?.data?.email_logo ||
  response?.data?.logo ||
  response?.data?.data?.logo ||
  response?.data?.path ||
  response?.data?.data?.path ||
  response?.data?.url ||
  response?.data?.data?.url ||
  response?.email_logo ||
  response?.logo ||
  response?.path ||
  response?.url ||
  "";

export const buildMailConfigPayload = (formData = {}) => {
  const providerDefaults = MAIL_PROVIDER_DEFAULTS[formData.mail_provider] || MAIL_PROVIDER_DEFAULTS.gmail;
  const smtpUsername = formData.mail_provider === "custom"
    ? formData.smtp_username
    : formData.smtp_username || formData.sender_email;

  return {
    smtp_host: formData.smtp_host || providerDefaults.smtp_host,
    smtp_port: formData.smtp_port || providerDefaults.smtp_port,
    smtp_encryption: formData.smtp_encryption || providerDefaults.smtp_encryption,
    smtp_username: smtpUsername,
  };
};

export const normalizeCompanyData = (company = {}) => {
  const provider = company?.mail_provider || "gmail";
  const providerDefaults = MAIL_PROVIDER_DEFAULTS[provider] || MAIL_PROVIDER_DEFAULTS.gmail;

  return {
    ...companyMasterSchema.form.initialValues,
    ...company,
    company_name: company?.company_name || "",
    sender_email: company?.sender_email || "",
    cc_email: company?.cc_email || "",
    sender_name: company?.sender_name || "",
    mail_provider: provider,
    smtp_host: company?.smtp_host || providerDefaults.smtp_host,
    smtp_port: company?.smtp_port || providerDefaults.smtp_port,
    smtp_encryption: company?.smtp_encryption || providerDefaults.smtp_encryption,
    smtp_username: company?.smtp_username || "",
    mail_connection_status: company?.mail_connection_status || "not_tested",
    mail_last_tested_at: company?.mail_last_tested_at || null,
    email_app_password: company?.email_app_password || "",
    mobile_number: company?.mobile_number || "",
    company_address: company?.company_address || "",
    country: company?.country || "",
    state: company?.state || "",
    city: company?.city || "",
    zip: company?.zip || "",
    pan: company?.pan || "",
    time_format: company?.time_format || "DD-MM-YYYY",
    date_format: company?.date_format || "DD-MM-YYYY",
    email_logo: company?.email_logo || "",
    status: company?.status || "active",
  };
};

export const getConnectionBadge = (status = "not_tested") => {
  if (status === "connected") {
    return { label: "Connected", className: "bg-green-50 text-green-700 border-green-200" };
  }

  if (status === "failed") {
    return { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" };
  }

  return { label: "Not Tested", className: "bg-slate-50 text-slate-600 border-slate-200" };
};
