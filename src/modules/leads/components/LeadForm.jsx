import { X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import { leadsModuleSchema } from "../data/module.schema";
import { useLeadForm } from "../hooks/useLeadForm";

const EMPTY_INITIAL_VALUES = {};

function LeadForm({ isOpen, onClose, selectedLead, initialValues = EMPTY_INITIAL_VALUES, onAfterSave, menu_id }) {
  const form = useLeadForm({ isOpen, onClose, selectedLead, initialValues, onAfterSave });
  if (!isOpen) return null;

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={form.handleClose}
      title={selectedLead ? "Edit Lead" : "Create Lead"}
      panelClassName="!w-[720px] max-w-full"
      closeButton={<button className="flyout-close" onClick={form.handleClose} aria-label="Close panel"><X size={18} /></button>}
      footer={<div className="flex w-full justify-end gap-3">
        <ActionButton disabled={form.loading} variant="flyoutSecondary" onClick={form.handleClose}>Cancel</ActionButton>
        <ActionButton disabled={form.loading || form.fetchingLead} variant="flyoutSecondary" onClick={form.handleSave}>
          {form.loading ? <Spinner /> : null} Save
        </ActionButton>
      </div>}
    >
      <div className="flyout-form-shell"><div className="ws-main-container">
        {form.fetchingLead ? <div className="p-5 text-center"><Spinner /></div> : (
          <div className="rounded-xl bg-white px-4 py-3">
            <DynamicModuleForm
              sections={leadsModuleSchema.form.sections}
              values={form.formData}
              onChange={form.handleChange}
              onObjectSelect={form.handleCustomerSelect}
              errors={form.errors}
              menuId={menu_id}
            />
          </div>
        )}
      </div></div>
    </FlyoutPanel>
  );
}

export default LeadForm;
