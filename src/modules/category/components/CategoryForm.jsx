import { X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import { categoryModuleSchema } from "../data/module.schema";
import { useCategoryForm } from "../hooks/useCategoryForm";

function CategoryForm({ isOpen, onClose, selectedCategory, onAfterSave, menu_id }) {
  const {
    loading,
    fetchingCategory,
    formData,
    errors,
    handleClose,
    handleChange,
    handleSave,
  } = useCategoryForm({ isOpen, onClose, selectedCategory, onAfterSave });

  if (!isOpen) {
    return null;
  }

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCategory ? "Edit Category" : "Create Category"}
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingCategory} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingCategory}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingCategory ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingCategory ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={categoryModuleSchema.form.sections}
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

export default CategoryForm;
