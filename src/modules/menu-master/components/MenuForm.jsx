import { X } from "lucide-react";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { menuMasterSchema } from "../data/module.schema";
import { useMenuForm } from "../hooks/useMenuForm";

function MenuForm({ isOpen, onClose, selectedMenu, onAfterSave, menu_id: permissionMenuId }) {
  const {
    loading,
    fetchingMenu,
    formData,
    errors,
    handleChange,
    handleSave,
    handleClose,
  } = useMenuForm({ isOpen, onClose, selectedMenu, onAfterSave });

  if (!isOpen) return null;

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedMenu ? "Edit Menu" : "Create Menu"}
      panelClassName="!w-[540px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={handleClose}>
          <X size={18} />
        </button>
      }
      footer={
        <ActionButton
          disabled={loading}
          variant="flyoutPrimary"
          onClick={handleSave}
        >
          {loading || fetchingMenu ? <Spinner /> : null}
          Save
        </ActionButton>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingMenu ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={menuMasterSchema.form.sections}
                values={formData}
                onChange={handleChange}
                errors={errors}
                menuId={permissionMenuId}
              />
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default MenuForm;
