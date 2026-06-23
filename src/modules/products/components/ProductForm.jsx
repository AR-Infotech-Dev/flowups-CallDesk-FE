import { X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import { productsModuleSchema } from "../data/module.schema";
import { useProductForm } from "../hooks/useProductForm";

function ProductForm({ isOpen, onClose, selectedProduct, onAfterSave, menu_id }) {
  const {
    loading,
    fetchingProduct,
    formData,
    errors,
    handleClose,
    handleChange,
    handleSave,
  } = useProductForm({ isOpen, onClose, selectedProduct, onAfterSave });

  if (!isOpen) {
    return null;
  }

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedProduct ? "Edit Product" : "Create Product"}
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingProduct} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingProduct}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingProduct ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
      panelClassName="!w-[540px]"
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingProduct ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={productsModuleSchema.form.sections}
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

export default ProductForm;
