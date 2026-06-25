import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { customerModuleSchema } from "@modules/customer/data/module.schema";
import { ticketsModuleSchema } from "../data/module.schema";
import {
  getCustomerDetailsForTicket,
  getTicketDetails,
  getTicketWorkLogs,
  saveTicket,
  searchCustomerByName,
} from "../data/ticketForm.service";
import { findActiveWorkLog } from "../utils/workLogStatus";
import {
  buildTicketSavePayload,
  getPrimaryCustomerContact,
  getTicketIdentifier,
  isCustomizationQueryName,
  mergeCurrentTicketProduct,
  normalizeCustomerContacts,
  normalizeCustomerProducts,
  normalizeTicketCustomerData,
  normalizeTicketData,
} from "../utils/ticketForm.utils";

export const useTicketForm = ({ isOpen, onClose, selectedTicket, onAfterSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingTicket, setFetchingTicket] = useState(false);
  const [formData, setFormData] = useState(ticketsModuleSchema.form.initialValues);
  const [oldformData, setOldFormData] = useState(ticketsModuleSchema.form.initialValues);
  const [selectedCustomer, setSelectedCustomer] = useState({});
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [newCustomerInitialValues, setNewCustomerInitialValues] = useState({});
  const [pendingCustomerSelect, setPendingCustomerSelect] = useState(null);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("client");

  const mode = selectedTicket ? "edit" : "create";
  const ticketId = getTicketIdentifier(selectedTicket);

  const resetFormState = () => {
    setFormData(ticketsModuleSchema.form.initialValues);
    setOldFormData(ticketsModuleSchema.form.initialValues);
    setSelectedCustomer({});
    setIsCustomerFormOpen(false);
    setNewCustomerInitialValues({});
    setPendingCustomerSelect(null);
    setErrors({});
    setTab("client");
  };

  const loadCustomerDetails = async (customerId, fallback = {}) => {
    if (!customerId) return fallback;

    try {
      const res = await getCustomerDetailsForTicket(customerId);
      return {
        ...fallback,
        ...(res?.data || {}),
        customer_id: customerId,
      };
    } catch {
      return fallback;
    }
  };
  const fetchTicketDetails = async () => {
    if (!isOpen || !ticketId) return;

    try {
      setFetchingTicket(true);
      const res = await getTicketDetails(ticketId);
      const ticketData = res?.data || selectedTicket;
      const normalizedTicket = normalizeTicketData(ticketData);
      const normalizedCustomer = normalizeTicketCustomerData(ticketData);
      const customerId = normalizedCustomer?.customer_id || normalizedTicket?.client_id;
      const detailedCustomer = customerId
        ? await loadCustomerDetails(customerId, normalizedCustomer)
        : normalizedCustomer;
      const normalizedDetailedCustomer = normalizeTicketCustomerData({ ...ticketData, customer: detailedCustomer });
      const customerProducts = mergeCurrentTicketProduct(normalizedDetailedCustomer.customer_products, normalizedTicket);
      const customerContacts = normalizeCustomerContacts(normalizedDetailedCustomer.customer_contacts || normalizedDetailedCustomer.contact_persons);

      setFormData({
        ...normalizedTicket,
        customer_products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      });
      setOldFormData(normalizedTicket);
      setSelectedCustomer({
        ...normalizedDetailedCustomer,
        customer_products: customerProducts,
        products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      });
    } catch (error) {
      toast.error("Unable to fetch ticket details");
      setFormData(normalizeTicketData(selectedTicket));
      setOldFormData(normalizeTicketData(selectedTicket));
      setSelectedCustomer(normalizeTicketCustomerData(selectedTicket));
    } finally {
      setFetchingTicket(false);
    }
  };
  useEffect(() => {
    if (mode !== "edit" && tab !== "client") {
      setTab("client");
    }
  }, [mode, tab]);

  useEffect(() => {
    if (selectedTicket && isOpen) {
      fetchTicketDetails();
      return;
    }

    resetFormState();
  }, [selectedTicket, isOpen, ticketId]);

  const handleClose = () => {
    setFormData(ticketsModuleSchema.form.initialValues);
    setSelectedCustomer({});
    setErrors({});
    setTab("client");
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "product_id"
        ? (() => {
          const product = normalizeCustomerProducts(current.customer_products).find((item) => String(item.product_id) === String(value));
          return {
            product_name: product?.product_name || null,
            product_serial_number: product?.serial_number || null,
            product_add_ons: [],
          };
        })()
        : {}),
      ...(name === "contact_person"
        ? (() => {
          const contact = normalizeCustomerContacts(current.customer_contacts || current.contact_persons).find((item) => String(item.name) === String(value));
          return {
            contact_no: contact?.mobile_no || current.contact_no || "",
          };
        })()
        : {}),
      ...(name === "query_type" && !isCustomizationQueryName(current.query_type_name)
        ? { product_add_ons: [] }
        : {}),
    }));
  };

  const handleObjectSelect = async (field, item = {}) => {
    if (field.name === "query_type") {
      const queryTypeName = item?.categoryName || item?.label || item?.name || "";
      setFormData((current) => ({
        ...current,
        query_type_name: queryTypeName,
        ...(!isCustomizationQueryName(queryTypeName) ? { product_add_ons: [] } : {}),
      }));
      return;
    }

    if (field.name !== "client_id") return;

    const customer = item?.original || item || {};
    const customerId = customer?.customer_id;
    const detailedCustomer = customerId ? await loadCustomerDetails(customerId, customer) : {};
    const normalizedCustomer = normalizeTicketCustomerData({ customer: detailedCustomer });
    const customerProducts = normalizeCustomerProducts(normalizedCustomer.customer_products);
    const customerContacts = normalizeCustomerContacts(normalizedCustomer.customer_contacts || normalizedCustomer.contact_persons);
    const primaryContact = getPrimaryCustomerContact(customerContacts);

    setSelectedCustomer(customerId ? {
      ...normalizedCustomer,
      customer_products: customerProducts,
      products: customerProducts,
      customer_contacts: customerContacts,
      contact_persons: customerContacts,
    } : {});

    setFormData((current) => ({
      ...current,
      contact_no: primaryContact?.mobile_no || detailedCustomer?.mobile_no || "",
      contact_person: primaryContact?.name || detailedCustomer?.contact_person || current.contact_person || "",
      ...(String(current.client_id || "") !== String(customerId || "")
        ? {
          product_id: null,
          product_name: null,
          product_serial_number: null,
          product_add_ons: [],
        }
        : {}),
      customer_products: customerProducts,
      customer_contacts: customerContacts,
      contact_persons: customerContacts,
    }));
  };

  const openCustomerCreate = ({ searchText = "", selectOption } = {}) => {
    setNewCustomerInitialValues(searchText ? { name: searchText } : {});
    setPendingCustomerSelect(() => selectOption);
    setIsCustomerFormOpen(true);
  };

  const resolveSavedCustomer = async (res = {}, payload = {}) => {
    const responseCustomer = Array.isArray(res?.data) ? res.data[0] : res?.data;
    const customerId =
      responseCustomer?.customer_id ||
      responseCustomer?.id ||
      res?.customer_id ||
      res?.id ||
      res?.last_insert_id ||
      res?.lastID ||
      res?.insertId;

    if (customerId) {
      const detailRes = await getCustomerDetailsForTicket(customerId);
      return {
        ...payload,
        ...(detailRes?.data || responseCustomer || {}),
        customer_id: customerId,
      };
    }

    if (payload?.name) {
      const searchRes = await searchCustomerByName(payload.name);
      const matchedCustomer = (searchRes?.data || []).find((item) => item?.name === payload.name) || searchRes?.data?.[0];
      if (matchedCustomer?.customer_id) {
        return {
          ...payload,
          ...matchedCustomer,
        };
      }
    }

    return {
      ...payload,
      ...(responseCustomer || {}),
    };
  };

  const handleCustomerSaved = async (res, payload) => {
    try {
      const customer = await resolveSavedCustomer(res, payload);
      if (!customer?.customer_id) {
        toast.error("Customer saved, but customer id was not received");
        return;
      }

      const option = {
        value: customer.customer_id,
        label: customer.name || "Unnamed Client",
        original: customer,
      };

      pendingCustomerSelect?.(option);
      const normalizedCustomer = normalizeTicketCustomerData({ customer });
      const customerProducts = normalizeCustomerProducts(normalizedCustomer.customer_products);
      const customerContacts = normalizeCustomerContacts(normalizedCustomer.customer_contacts || normalizedCustomer.contact_persons);
      const primaryContact = getPrimaryCustomerContact(customerContacts);

      setSelectedCustomer({
        ...normalizedCustomer,
        customer_products: customerProducts,
        products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      });
      setFormData((current) => ({
        ...current,
        client_id: customer.customer_id,
        contact_no: primaryContact?.mobile_no || customer.mobile_no || "",
        contact_person: primaryContact?.name || customer.contact_person || current.contact_person || "",
        product_id: null,
        product_name: null,
        product_serial_number: null,
        product_add_ons: [],
        customer_products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      }));
    } catch (error) {
      toast.error(error.message || "Unable to load saved customer");
    } finally {
      setPendingCustomerSelect(null);
      setNewCustomerInitialValues({});
    }
  };

  const handleSave = async () => {
    const payload = buildTicketSavePayload(formData);
    const result = ticketsModuleSchema.validationSchema.safeParse(payload);

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

      const assigneeChanged =
        mode === "edit" &&
        String(payload.assignee || "") !== String(oldformData.assignee || "");

      if (assigneeChanged) {
        const workLogRes = await getTicketWorkLogs(ticketId);
        const activeWorkLog =
          workLogRes?.summary?.active_work_log ||
          findActiveWorkLog(workLogRes?.data || []);

        if (activeWorkLog) {
          toast.error("This ticket has already started work. End the active work before reassigning.");
          setLoading(false);
          return;
        }
      }

      const res = await saveTicket({ mode, ticketId, payload });

      if (res.success) {
        toast.success(res?.message || `Ticket ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(ticketsModuleSchema.form.initialValues);
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

  const closeCustomerForm = () => {
    setIsCustomerFormOpen(false);
    setPendingCustomerSelect(null);
    setNewCustomerInitialValues({});
  };

  return {
    customerMenuId: customerModuleSchema.menu_id,
    loading,
    fetchingTicket,
    formData,
    oldformData,
    selectedCustomer,
    isCustomerFormOpen,
    newCustomerInitialValues,
    errors,
    tab,
    setTab,
    mode,
    ticketId,
    handleClose,
    handleChange,
    handleObjectSelect,
    openCustomerCreate,
    handleCustomerSaved,
    handleSave,
    closeCustomerForm,
    fetchTicketDetails
  };
};
