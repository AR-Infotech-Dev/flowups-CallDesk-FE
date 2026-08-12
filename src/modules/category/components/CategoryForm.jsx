import { X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import { categoryModuleSchema } from "../data/module.schema";
import { useCategoryForm } from "../hooks/useCategoryForm";
import ChildrenArranger from "./ChildrenArranger";

import { changeCategoryPosition } from "../data/categories.service";

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
  const emitValueChange = async (nextValue) => {

    
    handleChange({
        target: {
            name: "children",
            value: nextValue,
        },
    }); 

    
    const menu_ids = nextValue.map(
        (child) => child.category_id
    );

    console.log("NEW ORDER IDS:", menu_ids);

    try {
        await changeCategoryPosition({
            parent_id: formData.category_id,
            menu_ids,
        });

        console.log("ORDER SAVED");
    } catch (error) {
        console.error("ORDER SAVE FAILED:", error);
    }
};

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

              {formData.is_parent === "yes" && (
                <ChildrenArranger
                  value={formData.children || []}
                  onChange={emitValueChange}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CategoryForm;
