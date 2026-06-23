import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { productsModuleSchema } from "../data/module.schema";
import { getProductDetails, saveProduct } from "../data/products.service";
import {
  getProductIdentifier,
  normalizeProductData,
  normalizeProductSavePayload,
} from "../utils/products.utils";

export function useProductForm({ isOpen, onClose, selectedProduct, onAfterSave }) {
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [formData, setFormData] = useState(productsModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});

  const mode = selectedProduct ? "edit" : "create";
  const productId = getProductIdentifier(selectedProduct);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isOpen || !productId) return;

      try {
        setFetchingProduct(true);
        const res = await getProductDetails(productId);
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
    const payload = normalizeProductSavePayload(formData);
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
      const res = await saveProduct({ mode, productId, payload });

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

  return {
    loading,
    fetchingProduct,
    formData,
    errors,
    handleClose,
    handleChange,
    handleSave,
  };
}
