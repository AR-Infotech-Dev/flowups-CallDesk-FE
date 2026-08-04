import { ticketsModuleSchema } from "../data/module.schema";

export const getAmcticketIdentifier = (amcticket = {}) =>
  amcticket?.ticket_id ?? amcticket?.ticketID ?? amcticket?.id;

export const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const normalizeCustomerProducts = (source = []) => {
  const rows = typeof source === "string" ? safeParseJson(source, []) : source;
  return Array.isArray(rows)
    ? rows
      .map((row) => ({
        product_id: row?.product_id || "",
        product_name: row?.product_name || "",
        serial_number: row?.serial_number || row?.product_serial_number || "",
        add_ons: Array.isArray(row?.add_ons) ? row.add_ons.filter(Boolean) : [],
      }))
      .filter((row) => row.product_id || row.product_name || row.serial_number || row.add_ons.length)
    : [];
};

export const normalizeCustomerContacts = (source = []) => {
  const rows = typeof source === "string" ? safeParseJson(source, []) : source;
  return Array.isArray(rows)
    ? rows
      .map((row) => ({
        contact_id: row?.contact_id || "",
        name: row?.name || row?.contact_person || "",
        mobile_no: row?.mobile_no || row?.contact_no || "",
        email: row?.email || "",
        designation: row?.designation || "",
        department: row?.department || "",
        is_primary: row?.is_primary || "n",
      }))
      .filter((row) => row.name || row.mobile_no || row.email || row.designation || row.department)
    : [];
};

export const normalizeMobileNumber = (value = "") => String(value || "").replace(/\D/g, "");

export const findCustomerContactByMobile = (contacts = [], mobile = "") => {
  const normalizedMobile = normalizeMobileNumber(mobile);
  if (!normalizedMobile) return null;

  return normalizeCustomerContacts(contacts).find((contact) => normalizeMobileNumber(contact.mobile_no) === normalizedMobile) || null;
};

export const normalizeAmcticketAddOns = (source = []) => {
  if (typeof source === "string") {
    try {
      return normalizeAmcticketAddOns(JSON.parse(source));
    } catch {
      return source.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return String(item.name || item.add_on_name || item.label || item.value || "").trim();
      }

      return String(item || "").trim();
    })
    .filter(Boolean);
};

export const normalizeAmcticketAddOn = (source = "") => normalizeAmcticketAddOns(source)[0] || "";

export const isCustomizationQueryName = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "customization" || normalized === "customizations";
};

export const normalizeAmcticketData = (amcticket = {}) => ({
  ...ticketsModuleSchema.form.initialValues,
  ...amcticket,
  amcticket_id: getAmcticketIdentifier(amcticket) || null,
  description: amcticket?.description || null,
  contact_no: amcticket?.contact_no || null,
  start_date: amcticket?.start_date
    ? new Date(amcticket.start_date).toISOString().split("T")[0]
    : null,
  due_date: amcticket?.due_date
    ? new Date(amcticket.due_date).toISOString().split("T")[0]
    : null,
  query_type: amcticket?.query_type || null,
  ticket_status: amcticket?.ticket_status || null,
  ticket_priority: amcticket?.ticket_priority || null,
  product_id: amcticket?.product_id || null,
  product_name: amcticket?.product_name || null,
  product_serial_number: amcticket?.product_serial_number || amcticket?.serial_number || null,
  product_add_ons: normalizeAmcticketAddOn(amcticket?.product_add_ons || amcticket?.add_ons || amcticket?.addons || ""),
  customer_products: normalizeCustomerProducts(amcticket?.customer_products || amcticket?.products || []),
  customer_contacts: normalizeCustomerContacts(amcticket?.customer_contacts || amcticket?.contact_persons || []),
  contact_persons: normalizeCustomerContacts(amcticket?.contact_persons || amcticket?.customer_contacts || []),
  assignee: amcticket?.assignee || null,
  status: amcticket?.status || "active",
});

export const normalizeAmcticketCustomerData = (amcticket = {}) => {
  const customer =
    amcticket?.customer ||
    amcticket?.client ||
    amcticket?.customer_details ||
    amcticket?.client_details ||
    {};

  const customerId =
    customer?.customer_id ||
    customer?.id ||
    amcticket?.customer_id ||
    amcticket?.client_id;

  if (!customerId) return {};

  return {
    ...customer,
    customer_id: customerId,
    name:
      customer?.name ||
      amcticket?.customer_name ||
      amcticket?.client_name ||
      amcticket?.client ||
      "",
    created_date:
      customer?.created_date ||
      amcticket?.customer_created_date ||
      amcticket?.client_created_date ||
      "",
    mobile_no:
      customer?.mobile_no ||
      amcticket?.mobile_no ||
      amcticket?.contact_no ||
      "",
    customer_products: normalizeCustomerProducts(customer?.customer_products || customer?.products || amcticket?.customer_products || amcticket?.products || []),
    customer_contacts: normalizeCustomerContacts(customer?.customer_contacts || customer?.contact_persons || amcticket?.customer_contacts || amcticket?.contact_persons || []),
    contact_persons: normalizeCustomerContacts(customer?.contact_persons || customer?.customer_contacts || amcticket?.contact_persons || amcticket?.customer_contacts || []),
    products: normalizeCustomerProducts(customer?.products || amcticket?.products || customer?.customer_products || amcticket?.customer_products || []),
  };
};

export const getPrimaryCustomerContact = (contacts = []) => {
  const normalizedContacts = normalizeCustomerContacts(contacts);
  return normalizedContacts.find((contact) => contact.is_primary === "y") || normalizedContacts[0] || null;
};

export const mergeCurrentAmcticketProduct = (products = [], amcticket = {}) => {
  const normalizedProducts = normalizeCustomerProducts(products);
  if (!amcticket?.product_id) return normalizedProducts;

  const hasCurrentProduct = normalizedProducts.some((product) => String(product.product_id) === String(amcticket.product_id));
  if (hasCurrentProduct) return normalizedProducts;

  return [
    {
      product_id: amcticket.product_id,
      product_name: amcticket.product_name || "",
      serial_number: amcticket.product_serial_number || amcticket.serial_number || "",
    },
    ...normalizedProducts,
  ];
};

export const mergeCurrentAmcticketContact = (contacts = [], amcticket = {}) => {
  const normalizedContacts = normalizeCustomerContacts(contacts);
  const amcticketContactName = String(amcticket?.contact_person || "").trim();
  const amcticketContactMobile = normalizeMobileNumber(amcticket?.contact_no);

  if (!amcticketContactName && !amcticketContactMobile) return normalizedContacts;

  const hasCurrentContact = normalizedContacts.some((contact) => {
    const sameMobile = amcticketContactMobile && normalizeMobileNumber(contact.mobile_no) === amcticketContactMobile;
    const sameName = amcticketContactName && String(contact.name || "").trim() === amcticketContactName;
    return sameMobile || sameName;
  });

  if (hasCurrentContact) return normalizedContacts;

  return [
    {
      contact_id: "",
      name: amcticketContactName || amcticketContactMobile,
      mobile_no: amcticketContactMobile,
      email: "",
      designation: "",
      department: "",
      is_primary: "n",
    },
    ...normalizedContacts,
  ];
};

export const buildAmcticketSavePayload = (formData = {}) => {
  const {
    customer_products,
    customer_contacts,
    contact_persons,
    ...ticketPayload
  } = formData;

  return {
    ...ticketPayload,
    product_add_ons: normalizeAmcticketAddOn(formData.product_add_ons),
    contact_details: formData.save_contact
      ? {
        ...(formData.contact_details || {}),
        mobile_no: normalizeMobileNumber(formData.contact_details?.mobile_no || formData.contact_no),
      }
      : undefined,
    title: formData.title || formData.client_name,
  };
};
