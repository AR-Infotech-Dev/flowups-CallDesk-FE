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

function normalizeCompanyData(company = {}) {
  return {
    ...companyMasterSchema.form.initialValues,
    ...company,
    company_name: company?.company_name || "",
    from_email: company?.from_email || "",
    cc_email: company?.cc_email || "",
    from_name: company?.from_name || "",
    mobile_number: company?.mobile_number || "",
    company_address: company?.company_address || "",
    country: company?.country || "",
    state: company?.state || "",
    city: company?.city || "",
    zip: company?.zip || "",
    pan: company?.pan || "",
    date_format: company?.date_format || "DD-MM-YYYY",
    email_logo: company?.email_logo || "",
    status: company?.status || "active",
  };
}

function CompanyMasterForm({ isOpen, onClose, selectedCompany, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
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
