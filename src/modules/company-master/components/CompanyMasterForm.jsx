import { useRef } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { companyMasterSchema } from "../data/module.schema";
import { useCompanyMasterForm } from "../hooks/useCompanyMasterForm";
import { getLogoUrl } from "../utils/companyMaster.utils";

function CompanyMasterForm({ isOpen, onClose, selectedCompany, onAfterSave, menu_id }) {
  const logoInputRef = useRef(null);
  const {
    loading,
    testingConnection,
    uploadingLogo,
    fetchingCompany,
    formData,
    errors,
    connectionEmailBadge,
    connectionDBBadge,
    handleClose,
    handleChange,
    handleLogoUpload,
    handleRemoveLogo,
    handleSave,
    handleTestEmailConnection,
    handleTestDBConnection

  } = useCompanyMasterForm({ isOpen, onClose, selectedCompany, onAfterSave });

  const EmailConnectionIcon = connectionEmailBadge.icon;
  const DBConnectionBadge = connectionDBBadge.icon;
  if (!isOpen) {
    return null;
  }

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCompany ? "Edit Company" : "Create Company"}
      panelClassName="!w-[640px] max-w-full"
      subtitle={
        <>
          <div className="flex gap-2">
            <span className={`flex gap-1 items-center rounded-sm  border px-1 py-1 font-semibold ${connectionEmailBadge.className} text-[10px]`} title={connectionEmailBadge.title}><EmailConnectionIcon size={14} className={connectionEmailBadge.spin ? "animate-spin" : ""} /></span>
            {
              formData.own_db_enabled === 'yes' &&
              <span className={`flex gap-1 items-center rounded-sm justify-center  border px-1 py-1 font-semibold ${connectionDBBadge.className} text-[10px]`} title={connectionDBBadge.title}><DBConnectionBadge size={14} className={connectionDBBadge.spin ? "animate-spin" : ""} /></span>
            }
          </div>
        </>
      }
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingCompany || testingConnection} variant="flyoutSecondary text-[8px]" onClick={handleTestEmailConnection}>
            {testingConnection ? <Spinner /> : null} Test Connection
          </ActionButton>
          {
            formData.own_db_enabled === 'yes' &&
            <ActionButton disabled={loading || fetchingCompany || testingConnection} variant="flyoutSecondary" onClick={handleTestDBConnection}>
              {testingConnection ? <Spinner /> : null} Test DB Connection
            </ActionButton>
          }
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
            <div className="rounded-sm bg-white px-4 py-3">
              <section className="company-logo-uploader">
                <div className="company-logo-preview">
                  {formData.email_logo ? (
                    <img src={getLogoUrl(formData.email_logo)} alt={`${formData.company_name || "Company"} logo`} />
                  ) : (
                    <ImagePlus size={28} />
                  )}
                </div>
                <div className="company-logo-copy">
                  <h3>Company Logo</h3>
                  <p>Upload a separate logo for this company. It will be used in reports and emails.</p>
                  {formData.email_logo ? <span>{formData.email_logo}</span> : null}
                </div>
                <div className="company-logo-actions">
                  {!formData.email_logo ? (
                    <ActionButton disabled={uploadingLogo || loading || fetchingCompany} variant="ghostPrimary" onClick={() => logoInputRef.current?.click()}>
                      {uploadingLogo ? <Spinner /> : <Upload size={15} />}
                      Upload Logo
                    </ActionButton>
                  ) : null}
                  {formData.email_logo ? (
                    <button type="button" className="company-logo-remove" onClick={handleRemoveLogo} disabled={uploadingLogo || loading}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="sr-only"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                />
              </section>
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
