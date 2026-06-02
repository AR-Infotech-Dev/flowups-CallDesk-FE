import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { companyMasterSchema } from "../data/module.schema";

function getCompanyIdentifier(company = {}) {
  return company?.company_id;
}

const MAIL_PROVIDER_DEFAULTS = {
  gmail: { smtp_host: "smtp.gmail.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  yahoo: { smtp_host: "smtp.mail.yahoo.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  outlook: { smtp_host: "smtp.office365.com", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
  custom: { smtp_host: "", smtp_port: "587", smtp_encryption: "tls", smtp_username: "" },
};

function normalizeCompanyData(company = {}) {
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
}

function CompanyMasterForm({ isOpen, onClose, selectedCompany, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [fetchingCompany, setFetchingCompany] = useState(false);
  const [formData, setFormData] = useState(companyMasterSchema.form.initialValues);
  const [errors, setErrors] = useState({});
  const mode = selectedCompany ? "edit" : "create";
  const companyId = getCompanyIdentifier(selectedCompany);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!isOpen || !companyId) {
        return;
      }

      try {
        setFetchingCompany(true);
        const res = await makeRequest(`${companyMasterSchema.api.edit}/${companyId}`, {
          method: "GET",
        });
        setFormData(normalizeCompanyData(res?.data || selectedCompany));
      } catch (error) {
        toast.error("Unable to fetch company details");
        setFormData(normalizeCompanyData(selectedCompany));
      } finally {
        setFetchingCompany(false);
      }
    };

    if (selectedCompany && isOpen) {
      fetchCompanyDetails();
      return;
    }

    setFormData(companyMasterSchema.form.initialValues);
    setErrors({});
  }, [selectedCompany, isOpen, companyId]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setFormData(companyMasterSchema.form.initialValues);
    setErrors({});
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "mail_provider" ? (MAIL_PROVIDER_DEFAULTS[value] || {}) : {}),
    }));
  };

  const handleSave = async () => {
    const payload = { ...formData };
    const result = companyMasterSchema.validationSchema.safeParse(payload);

    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path[0]] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      const saveUrl =
        mode === "create"
          ? companyMasterSchema.api.create
          : `${companyMasterSchema.api.edit}/${companyId}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success(res?.message || `Company ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(companyMasterSchema.form.initialValues);
        onClose();
        onAfterSave?.();
        return;
      }

      toast.error(res?.msg || res?.message || "Something went wrong");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const getConnectionBadge = () => {
    const status = formData.mail_connection_status || "not_tested";
    if (status === "connected") {
      return { label: "Connected", className: "bg-green-50 text-green-700 border-green-200" };
    }
    if (status === "failed") {
      return { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" };
    }
    return { label: "Not Tested", className: "bg-slate-50 text-slate-600 border-slate-200" };
  };

  const handleTestConnection = async () => {
    const result = companyMasterSchema.validationSchema.safeParse({
      ...formData,
      status: formData.status || "active",
    });

    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path[0]] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setTestingConnection(true);
      const res = await makeRequest(companyMasterSchema.api.testMail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: formData.company_id || companyId || null,
          company_name: formData.company_name,
          sender_name: formData.sender_name,
          sender_email: formData.sender_email,
          mail_provider: formData.mail_provider,
          smtp_host: formData.smtp_host,
          smtp_port: formData.smtp_port,
          smtp_encryption: formData.smtp_encryption,
          smtp_username: formData.smtp_username,
          email_app_password: formData.email_app_password,
        }),
      });

      if (res.success) {
        toast.success(res.message || "SMTP connection successful");
        setFormData((current) => ({
          ...current,
          mail_connection_status: "connected",
          mail_last_tested_at: res?.data?.mail_last_tested_at || new Date().toISOString(),
        }));
        return;
      }

      toast.error(res.message || "SMTP connection failed");
      setFormData((current) => ({
        ...current,
        mail_connection_status: "failed",
      }));
    } catch (error) {
      toast.error(error.message || "SMTP connection failed");
      setFormData((current) => ({
        ...current,
        mail_connection_status: "failed",
      }));
    } finally {
      setTestingConnection(false);
    }
  };

  const connectionBadge = getConnectionBadge();

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCompany ? "Edit Company" : "Create Company"}
      panelClassName="!w-[640px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${connectionBadge.className}`}>
            {connectionBadge.label}
          </span>
          <ActionButton disabled={loading || fetchingCompany || testingConnection} variant="flyoutSecondary" onClick={handleTestConnection}>
            {testingConnection ? <Spinner /> : null} Test Connection
          </ActionButton>
          <ActionButton disabled={loading || fetchingCompany} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingCompany}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingCompany ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingCompany ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={companyMasterSchema.form.sections}
                values={formData}
                onChange={handleChange}
                errors={errors}
                menuId={menu_id}
              />
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CompanyMasterForm;
