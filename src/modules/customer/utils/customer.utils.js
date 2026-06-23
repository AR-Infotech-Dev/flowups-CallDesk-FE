import { customerModuleSchema } from "../data/module.schema";

export function getCustomerIdentifier(customer = {}) {
  return customer?.customer_id;
}

export function normalizeCustomerData(customer = {}) {
  return {
    ...customerModuleSchema.form.initialValues,
    ...customer,
    name: customer?.name || null,
    email: customer?.email || null,
    mobile_no: customer?.mobile_no || null,
    wa_no: customer?.wa_no || null,
    birth_date: customer?.birth_date ? new Date(customer.birth_date).toISOString().split("T")[0] : null,
    address: customer?.address || null,
    pan_number: customer?.pan_number || null,
    company_name: customer?.company_name || null,
    billing_name: customer?.billing_name || null,
    billing_address: customer?.billing_address || null,
    company_id: customer?.company_id || null,
    mailing_address: customer?.mailing_address || null,
    is_amc: String(customer?.is_amc || "no").toLowerCase(),
    amc_term_period: customer?.amc_term_period || null,
    amc_start_date: customer?.amc_start_date ? new Date(customer.amc_start_date).toISOString().split("T")[0] : null,
    amc_end_date: customer?.amc_end_date ? new Date(customer.amc_end_date).toISOString().split("T")[0] : null,
  };
}

export const normalizeAddOns = (value = [], { keepEmpty = false } = {}) => {
  const finalize = (items) => keepEmpty ? items : items.filter(Boolean);

  if (Array.isArray(value)) {
    return finalize(value.map((item) => {
      if (typeof item === "object" && item !== null) {
        return String(item.name || item.add_on_name || item.label || "").trim();
      }

      return String(item || "").trim();
    }));
  }

  if (value === undefined || value === null) return [];

  return finalize(String(value).split(",").map((item) => item.trim()));
};

export const normalizeCustomerProducts = (customer = {}) => {
  const rows = customer?.customer_products || customer?.products || [];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      product_id: row?.product_id || "",
      product_name: row?.product_name || "",
      serial_number: row?.serial_number || "",
      expiry_date: row?.expiry_date || "",
      add_ons: normalizeAddOns(row?.add_ons || row?.addons || row?.addOns),
    }))
    .filter((row) => row.product_id || row.product_name || row.serial_number || row.expiry_date || row.add_ons.length);
};
