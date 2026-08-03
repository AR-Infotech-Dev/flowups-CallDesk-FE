import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { customerModuleSchema } from "@modules/customer/data/module.schema";
import { ticketsModuleSchema } from "../data/module.schema";
import {
  getCustomerDetailsForAmcticket,
  getAmcticketDetails,
  getAmcticketWorkLogs,
  saveAmcticket,
  searchCustomerByName,
} from "../data/amcticketForm.service";
import { findActiveWorkLog } from "../utils/workLogStatus";
import {
  buildAmcticketSavePayload,
  findCustomerContactByMobile,
  getPrimaryCustomerContact,
  getAmcticketIdentifier,
  isCustomizationQueryName,
  mergeCurrentAmcticketContact,
  mergeCurrentAmcticketProduct,
  normalizeCustomerContacts,
  normalizeMobileNumber,
  normalizeCustomerProducts,
  normalizeAmcticketCustomerData,
  normalizeAmcticketData,
} from "../utils/amcticketForm.utils";

export const useAmcticketForm = ({ isOpen, onClose, selectedAmcticket, onAfterSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingAmcticket, setFetchingAmcticket] = useState(false);
  const [formData, setFormData] = useState(ticketsModuleSchema.form.initialValues);
  const [oldformData, setOldFormData] = useState(ticketsModuleSchema.form.initialValues);
  const [selectedCustomer, setSelectedCustomer] = useState({});
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [newCustomerInitialValues, setNewCustomerInitialValues] = useState({});
  const [pendingCustomerSelect, setPendingCustomerSelect] = useState(null);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("client");

  const mode = selectedAmcticket ? "edit" : "create";
  const ticketId = getAmcticketIdentifier(selectedAmcticket);

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
      const res = await getCustomerDetailsForAmcticket(customerId);
      return {
        ...fallback,
        ...(res?.data || {}),
        customer_id: customerId,
      };
    } catch {
      return fallback;
    }
  };
  const fetchAmcticketDetails = async () => {
    console.log(`Fetching AMC ticket details for ID: ${ticketId}`);
    if (!isOpen || !ticketId) return;

    try {
      setFetchingAmcticket(true);
      const res = await getAmcticketDetails(ticketId);
      const amcticketData = res?.data || selectedAmcticket;
      const amcticketDataWithSelectedContact = {
        ...amcticketData,
        ...(selectedAmcticket?.contact_person ? { contact_person: selectedAmcticket.contact_person } : {}),
        ...(selectedAmcticket?.contact_no ? { contact_no: selectedAmcticket.contact_no } : {}),
      };
      const normalizedAmcticket = normalizeAmcticketData(amcticketDataWithSelectedContact);
      const normalizedCustomer = normalizeAmcticketCustomerData(amcticketData);
      const customerId = normalizedCustomer?.customer_id || normalizedAmcticket?.client_id;
      const detailedCustomer = customerId
        ? await loadCustomerDetails(customerId, normalizedCustomer)
        : normalizedCustomer;
      const normalizedDetailedCustomer = normalizeAmcticketCustomerData({ ...amcticketDataWithSelectedContact, customer: detailedCustomer });
      const customerProducts = mergeCurrentAmcticketProduct(normalizedDetailedCustomer.customer_products, normalizedAmcticket);
      const customerContacts = mergeCurrentAmcticketContact(
        normalizedDetailedCustomer.customer_contacts || normalizedDetailedCustomer.contact_persons,
        normalizedAmcticket
      );
      const matchedContact = findCustomerContactByMobile(customerContacts, normalizedAmcticket.contact_no);
      const resolvedAmcticketContact = mode === "edit"
        ? (normalizedAmcticket.contact_person || selectedAmcticket?.contact_person || "")
        : (matchedContact?.name || normalizedAmcticket.contact_person || "");
      const resolvedAmcticketContactNo = mode === "edit"
        ? (normalizedAmcticket.contact_no || selectedAmcticket?.contact_no || "")
        : (matchedContact?.mobile_no || normalizedAmcticket.contact_no || "");

      setFormData({
        ...normalizedAmcticket,
        contact_person: resolvedAmcticketContact,
        contact_no: resolvedAmcticketContactNo,
        customer_products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      });
      setOldFormData(normalizedAmcticket);
      setSelectedCustomer({
        ...normalizedDetailedCustomer,
        ...(mode === "edit"
          ? {
            contact_person: resolvedAmcticketContact || normalizedDetailedCustomer.contact_person,
            mobile_no: resolvedAmcticketContactNo || normalizedDetailedCustomer.mobile_no,
          }
          : {}),
        customer_products: customerProducts,
        products: customerProducts,
        customer_contacts: customerContacts,
        contact_persons: customerContacts,
      });
    } catch (error) {
      toast.error("Unable to fetch amcticket details");
      const normalizedSelectedAmcticket = normalizeAmcticketData(selectedAmcticket);
      setFormData(normalizedSelectedAmcticket);
      setOldFormData(normalizedSelectedAmcticket);
      setSelectedCustomer(normalizeAmcticketCustomerData(selectedAmcticket));
    } finally {
      setFetchingAmcticket(false);
    }
  };
  useEffect(() => {
    if (mode !== "edit" && tab !== "client") {
      setTab("client");
    }
  }, [mode, tab]);

  useEffect(() => {
    if (selectedAmcticket && isOpen) {
      setFormData(normalizeAmcticketData(selectedAmcticket));
      setOldFormData(normalizeAmcticketData(selectedAmcticket));
      setSelectedCustomer(normalizeAmcticketCustomerData(selectedAmcticket));
      setErrors({});
      fetchAmcticketDetails();
      return;
    }

    resetFormState();
  }, [selectedAmcticket, isOpen, ticketId]);

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
            save_contact: false,
            contact_details: ticketsModuleSchema.form.initialValues.contact_details,
          };
        })()
        : {}),
      ...(name === "contact_no"
        ? (() => {
          const mobile = normalizeMobileNumber(value);
          const contact = findCustomerContactByMobile(current.customer_contacts || current.contact_persons, mobile);
          if (contact) {
            return {
              contact_person: contact.name || current.contact_person || "",
              save_contact: false,
              contact_details: ticketsModuleSchema.form.initialValues.contact_details,
            };
          }

          return {
            contact_person: mobile.length === 10 ? "" : current.contact_person,
            save_contact: Boolean(current.client_id && mobile.length === 10),
            contact_details: {
              ...(current.contact_details || ticketsModuleSchema.form.initialValues.contact_details),
              mobile_no: mobile,
            },
          };
        })()
        : {}),
      ...(name === "query_type" && !isCustomizationQueryName(current.query_type_name)
        ? { product_add_ons: [] }
        : {}),
    }));
  };

  const handleQuickContactChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => {
      const nextContactDetails = {
        ...(current.contact_details || amcticketsModuleSchema.form.initialValues.contact_details),
        mobile_no: normalizeMobileNumber(current.contact_no),
      };

      if (name === "save_contact") {
        return {
          ...current,
          save_contact: checked,
          contact_details: nextContactDetails,
        };
      }

      return {
        ...current,
        save_contact: true,
        contact_person: name === "name" ? value : current.contact_person,
        contact_details: {
          ...nextContactDetails,
          [name]: value,
        },
      };
    });
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
    const normalizedCustomer = normalizeAmcticketCustomerData({ customer: detailedCustomer });
    const customerProducts = normalizeCustomerProducts(normalizedCustomer.customer_products);
    const customerContacts = normalizeCustomerContacts(normalizedCustomer.customer_contacts || normalizedCustomer.contact_persons);
    const primaryContact = getPrimaryCustomerContact(customerContacts);

    setSelectedCustomer(customerId ? {
      ...normalizedCustomer,
      ...(mode === "edit"
        ? {
          contact_person: formData.contact_person || normalizedCustomer.contact_person,
          mobile_no: formData.contact_no || normalizedCustomer.mobile_no,
        }
        : {}),
      customer_products: customerProducts,
      products: customerProducts,
      customer_contacts: customerContacts,
      contact_persons: customerContacts,
    } : {});

    setFormData((current) => ({
      ...current,
      contact_no: mode === "edit"
        ? current.contact_no
        : (primaryContact?.mobile_no || detailedCustomer?.mobile_no || ""),
      contact_person: mode === "edit"
        ? current.contact_person
        : (primaryContact?.name || detailedCustomer?.contact_person || current.contact_person || ""),
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
      const detailRes = await getCustomerDetailsForAmcticket(customerId);
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
      const normalizedCustomer = normalizeAmcticketCustomerData({ customer });
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
    const payload = buildAmcticketSavePayload(formData);
    const result = amcticketsModuleSchema.validationSchema.safeParse(payload);

    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path.join(".") || issue.path[0]] = issue.message;
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
        const workLogRes = await getAmcticketWorkLogs(ticketId);
        const activeWorkLog =
          workLogRes?.summary?.active_work_log ||
          findActiveWorkLog(workLogRes?.data || []);

        if (activeWorkLog) {
          toast.error("This ticket has already started work. End the active work before reassigning.");
          setLoading(false);
          return;
        }
      }

      const res = await saveAmcticket({ mode, ticketId, payload });

      if (res.success) {
        toast.success(res?.message || `Ticket ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(amcticketsModuleSchema.form.initialValues);
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
    fetchingAmcticket,
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
    handleQuickContactChange,
    handleObjectSelect,
    openCustomerCreate,
    handleCustomerSaved,
    handleSave,
    closeCustomerForm,
    fetchAmcticketDetails
  };
};
