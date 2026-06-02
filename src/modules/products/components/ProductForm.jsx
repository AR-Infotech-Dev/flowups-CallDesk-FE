import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { productsModuleSchema } from "../data/module.schema";

function getProductIdentifier(product = {}) {
  return product?.product_id || product?.id;
}

function normalizeProductData(product = {}) {
  return {
    ...productsModuleSchema.form.initialValues,
    ...product,
    product_name: product?.product_name || product?.productName || product?.name || "",
    product_type: product?.product_type || "",
    product_description: product?.product_description || "",
    company_id: product?.company_id || null,
  };
}

function normalizeSavePayload(formData = {}) {
  const payload = {
    product_name: formData.product_name,
    product_type: formData.product_type || null,
    product_description: formData.product_description || null,
  };

  if (formData.product_id) payload.product_id = formData.product_id;
  if (formData.company_id) payload.company_id = formData.company_id;

  return payload;
}

function ProductForm({ isOpen, onClose, selectedProduct, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [formData, setFormData] = useState(productsModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});
  const mode = selectedProduct ? "edit" : "create";
  const productId = getProductIdentifier(selectedProduct);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isOpen || !productId) {
        return;
      }

      try {
        setFetchingProduct(true);
        const res = await makeRequest(`${productsModuleSchema.api.edit}/${productId}`, {
          method: "GET",
        });
        setFormData(normalizeProductData(res?.data || selectedProduct));
      } catch (error) {
        toast.error("Unable to fetch product details");
        setFormData(normalizeProductData(selectedProduct));
      } finally {
        setFetchingProduct(false);
      }
    };

    if (selectedProduct && isOpen) {
      fetchProductDetails();
      return;
    }

    setFormData(productsModuleSchema.form.initialValues);
    setErrors({});
  }, [selectedProduct, isOpen, productId]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setFormData(productsModuleSchema.form.initialValues);
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
    const payload = normalizeSavePayload(formData);
    const result = productsModuleSchema.validationSchema.safeParse(payload);

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
          ? productsModuleSchema.api.create
          : `${productsModuleSchema.api.edit}/${productId}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success(res?.message || `Product ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(productsModuleSchema.form.initialValues);
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
      panelClassName = "!w-[540px]"
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
