import { X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import { customerModuleSchema } from "../data/module.schema";
import { useCustomerForm } from "../hooks/useCustomerForm";
import CustomerProductsEditor from "./CustomerProductsEditor";

const EMPTY_INITIAL_VALUES = {};

function CustomerForm({
  isOpen,
  onClose,
  selectedCustomer,
  initialValues = EMPTY_INITIAL_VALUES,
  onAfterSave,
  menu_id,
}) {
  const {
    loading,
    fetchingCustomer,
    formData,
    productOptions,
    productRows,
    loadingProducts,
    errors,
    handleClose,
    handleChange,
    handleSave,
    addProductRow,
    updateProductRow,
    removeProductRow,
    addProductAddon,
    updateProductAddon,
    removeProductAddon,
  } = useCustomerForm({
    isOpen,
    onClose,
    selectedCustomer,
    initialValues,
    onAfterSave,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCustomer ? "Edit Customer" : "Create Customer"}
      panelClassName="!w-[640px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingCustomer} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingCustomer}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingCustomer ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingCustomer ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={customerModuleSchema.form.sections}
                values={formData}
                onChange={handleChange}
                errors={errors}
                menuId={menu_id}
              />
              <CustomerProductsEditor
                productRows={productRows}
                productOptions={productOptions}
                loadingProducts={loadingProducts}
                onAddProductRow={addProductRow}
                onUpdateProductRow={updateProductRow}
                onRemoveProductRow={removeProductRow}
                onAddProductAddon={addProductAddon}
                onUpdateProductAddon={updateProductAddon}
                onRemoveProductAddon={removeProductAddon}
              />
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CustomerForm;
