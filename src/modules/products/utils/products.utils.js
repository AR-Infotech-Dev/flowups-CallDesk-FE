import { productsModuleSchema } from "../data/module.schema";

export function getProductIdentifier(product = {}) {
  return product?.product_id || product?.id;
}

export function normalizeProductData(product = {}) {
  return {
    ...productsModuleSchema.form.initialValues,
    ...product,
    product_name: product?.product_name || product?.productName || product?.name || "",
    product_type: product?.product_type || "",
    product_description: product?.product_description || "",
    rate: product?.rate ?? 0,
    gst_rate: product?.gst_rate ?? 0,
    company_id: product?.company_id || null,
  };
}

export function normalizeProductSavePayload(formData = {}) {
  const payload = {
    product_name: formData.product_name,
    product_type: formData.product_type || null,
    product_description: formData.product_description || null,
    rate: Number(formData.rate),
    gst_rate: Number(formData.gst_rate),
  };

  if (formData.product_id) payload.product_id = formData.product_id;
  if (formData.company_id) payload.company_id = formData.company_id;

  return payload;
}
