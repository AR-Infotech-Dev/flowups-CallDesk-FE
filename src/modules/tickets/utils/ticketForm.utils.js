import { ticketsModuleSchema } from "../data/module.schema";

export const getTicketIdentifier = (ticket = {}) => ticket?.ticket_id;

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
      .map((row) => {
        return ({
          product_id: row?.product_id || "",
          product_name: row?.product_name || "",
          serial_number: String(row?.serial_number || row?.product_serial_number || "").trim(),
          add_ons: normalizeTicketAddOns(row?.add_ons || row?.addons || row?.addOns || []),
        })
      })
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

export const normalizeTicketAddOns = (source = []) => {
  if (typeof source === "string") {
    try {
      return normalizeTicketAddOns(JSON.parse(source));
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

export const normalizeTicketAddOn = (source = "") => normalizeTicketAddOns(source)[0] || "";

export const isCustomizationQueryName = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "customization" || normalized === "customizations";
};

export const normalizeTicketData = (ticket = {}) => ({
  ...ticketsModuleSchema.form.initialValues,
  ...ticket,
  description: ticket?.description || null,
  contact_no: ticket?.contact_no || null,
  start_date: ticket?.start_date
    ? new Date(ticket.start_date).toISOString().split("T")[0]
    : null,
  due_date: ticket?.due_date
    ? new Date(ticket.due_date).toISOString().split("T")[0]
    : null,
  query_type: ticket?.query_type || null,
  ticket_status: ticket?.ticket_status || null,
  ticket_priority: ticket?.ticket_priority || null,
  product_id: ticket?.product_id || null,
  product_name: ticket?.product_name || null,
  product_serial_number: ticket?.product_serial_number || ticket?.serial_number || null,
  product_add_ons: normalizeTicketAddOn(ticket?.product_add_ons || ticket?.add_ons || ticket?.addons || ""),
  customer_products: normalizeCustomerProducts(ticket?.customer_products || ticket?.products || []),
  customer_contacts: normalizeCustomerContacts(ticket?.customer_contacts || ticket?.contact_persons || []),
  contact_persons: normalizeCustomerContacts(ticket?.contact_persons || ticket?.customer_contacts || []),
  ratings: ticket?.ratings || null,
  feedback_submitted: ticket?.feedback_submitted || null,
  assignee: ticket?.assignee || null,
  status: ticket?.status || "active",
});

export const normalizeTicketCustomerData = (ticket = {}) => {
  const customer =
    ticket?.customer ||
    ticket?.client ||
    ticket?.customer_details ||
    ticket?.client_details ||
    {};

  const customerId =
    customer?.customer_id ||
    customer?.id ||
    ticket?.customer_id ||
    ticket?.client_id;

  if (!customerId) return {};

  return {
    ...customer,
    customer_id: customerId,
    name:
      customer?.name ||
      ticket?.customer_name ||
      ticket?.client_name ||
      ticket?.client ||
      "",
    created_date:
      customer?.created_date ||
      ticket?.customer_created_date ||
      ticket?.client_created_date ||
      "",
    mobile_no:
      customer?.mobile_no ||
      ticket?.mobile_no ||
      ticket?.contact_no ||
      "",
    customer_products: normalizeCustomerProducts(customer?.customer_products || customer?.products || ticket?.customer_products || ticket?.products || []),
    customer_contacts: normalizeCustomerContacts(customer?.customer_contacts || customer?.contact_persons || ticket?.customer_contacts || ticket?.contact_persons || []),
    contact_persons: normalizeCustomerContacts(customer?.contact_persons || customer?.customer_contacts || ticket?.contact_persons || ticket?.customer_contacts || []),
    products: normalizeCustomerProducts(customer?.products || ticket?.products || customer?.customer_products || ticket?.customer_products || []),
  };
};

export const getPrimaryCustomerContact = (contacts = []) => {
  const normalizedContacts = normalizeCustomerContacts(contacts);
  return normalizedContacts.find((contact) => contact.is_primary === "y") || normalizedContacts[0] || null;
};

export const mergeCurrentTicketProduct = (products = [], ticket = {}) => {
  const normalizedProducts = normalizeCustomerProducts(products);
  if (!ticket?.product_id) return normalizedProducts;

  const hasCurrentProduct = normalizedProducts.some((product) => String(product.product_id) === String(ticket.product_id));
  if (hasCurrentProduct) return normalizedProducts;

  return [
    {
      product_id: ticket.product_id,
      product_name: ticket.product_name || "",
      serial_number: ticket.product_serial_number || ticket.serial_number || "",
    },
    ...normalizedProducts,
  ];
};

export const mergeCurrentTicketContact = (contacts = [], ticket = {}) => {
  const normalizedContacts = normalizeCustomerContacts(contacts);
  const ticketContactName = String(ticket?.contact_person || "").trim();
  const ticketContactMobile = normalizeMobileNumber(ticket?.contact_no);

  if (!ticketContactName && !ticketContactMobile) return normalizedContacts;

  const hasCurrentContact = normalizedContacts.some((contact) => {
    const sameMobile = ticketContactMobile && normalizeMobileNumber(contact.mobile_no) === ticketContactMobile;
    const sameName = ticketContactName && String(contact.name || "").trim() === ticketContactName;
    return sameMobile || sameName;
  });

  if (hasCurrentContact) return normalizedContacts;

  return [
    {
      contact_id: "",
      name: ticketContactName || ticketContactMobile,
      mobile_no: ticketContactMobile,
      email: "",
      designation: "",
      department: "",
      is_primary: "n",
    },
    ...normalizedContacts,
  ];
};

export const buildTicketSavePayload = (formData = {}) => {
  const {
    customer_products,
    customer_contacts,
    contact_persons,
    ...ticketPayload
  } = formData;

  return {
    ...ticketPayload,
    product_add_ons: normalizeTicketAddOn(formData.product_add_ons),
    contact_details: formData.save_contact
      ? {
        ...(formData.contact_details || {}),
        mobile_no: normalizeMobileNumber(formData.contact_details?.mobile_no || formData.contact_no),
      }
      : undefined,
    title: formData.title || formData.client_name,
  };
};
