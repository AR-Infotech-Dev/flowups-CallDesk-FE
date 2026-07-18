import { X } from "lucide-react";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import ActionButton from "@components/ui/ActionButton";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import Spinner from "@components/ui/Spinner";
import { useSubscriptionForm } from "../hooks/useSubscriptionsForm";
import { subscriptionsModuleSchema } from "../data/module.schema";

function SubscriptionForm({ isOpen, onClose, selectedSubscription, onAfterSave, menu_id }) {
  if (!isOpen) {
    return null;
  }

  const {
    loading,
    fetchingSubscription,
    formData,
    errors,
    handleClose,
    handleChange,
    handleSave,
  } = useSubscriptionForm({ isOpen, onClose, selectedSubscription, onAfterSave });


  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedSubscription ? "Edit Subscription" : "Create Subscription"}
      panelClassName="!w-[640px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <ActionButton
          className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
          disabled={loading}
          variant="flyoutPrimary"
          onClick={handleSave}
        >
          {loading || fetchingSubscription ? <Spinner /> : null} Save
        </ActionButton>
      }
    >
      <div className="flyout-form-shell px-4 py-3">
        <div className="ws-main-container">
          {fetchingSubscription ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <DynamicModuleForm
              sections={subscriptionsModuleSchema.form.sections}
              values={formData}
              onChange={handleChange}
              errors={errors}
              menuId={menu_id}
            />
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default SubscriptionForm;
