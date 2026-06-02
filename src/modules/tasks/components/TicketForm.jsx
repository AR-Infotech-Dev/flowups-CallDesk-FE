import { useEffect, useState } from "react";
import { X, PhoneCall, PhoneOutgoing, CheckCheck } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import { ticketsModuleSchema } from "../data/module.schema";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import ClientHistory from "./ClientHistory";
import TicketHistory from "./TicketHistory";
import Comments from "./Comments";
import CustomerForm from "../../customer/components/CustomerForm";
import { customerModuleSchema } from "../../customer/data/module.schema";

const TAB_ITEMS = [
  ["client", "Client History"],
  ["comments", "Comments"],
  ["history", "Ticket History"],
];


const CALL_HISTORY_ITEMS = [
  {
    key: "inbound-1",
    type: "Inbound Call",
    meta: "Today, 11:20 AM",
    agent: "Jordan Sterling",
    queryType: "Technical Issue",
    text: "Client reported recurring timeout. Escalated to L2 support.",
    tone: "info",
    icon: PhoneCall,
  },
  {
    key: "outbound-1",
    type: "Outbound Follow-up",
    meta: "Oct 24, 3:45 PM",
    agent: "Sarah Chen",
    queryType: "Billing Query",
    text: "Attempted contact, no answer. Left voicemail regarding invoice #882.",
    tone: "neutral",
    icon: PhoneOutgoing,
  },
  {
    key: "inbound-2",
    type: "Inbound Call",
    meta: "Oct 22, 10:15 AM",
    agent: "Alex Rivers",
    queryType: "General Inquiry",
    text: "Resolved billing query. Client confirmed access to portal.",
    tone: "success",
    icon: CheckCheck,
  },
];

const CLIENT_HISTORY_ITEMS = [
  { key: "TKT-1244", status: "In Progress", subject: "Payment Gateway Timeout" },
  { key: "TKT-1239", status: "Resolved", subject: "Monthly Usage Report Export" },
  { key: "TKT-1221", status: "Pending", subject: "API Access Key Rotation" },
  { key: "TKT-1211", status: "Pending", subject: "API Access Key Rotation" },
  { key: "TKT-1241", status: "Pending", subject: "API Access Key Rotation" },
  { key: "TKT-1271", status: "Pending", subject: "API Access Key Rotation" },
];

function getTicketIdentifier(ticket = {}) {
  return ticket?.ticket_id;
}

function normalizeCustomerProducts(source = []) {
  const rows = typeof source === "string" ? safeParseJson(source, []) : source;
  return Array.isArray(rows)
    ? rows
      .map((row) => ({
        product_id: row?.product_id || "",
        product_name: row?.product_name || "",
        serial_number: row?.serial_number || row?.product_serial_number || "",
      }))
      .filter((row) => row.product_id || row.product_name || row.serial_number)
    : [];
}

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeTaskData(ticket = {}) {
  return {
    ...ticketsModuleSchema.form.initialValues,
    ...ticket,
    // client_name: ticket?.client_name || ticket?.clientName || "",
    // title: ticket?.title || null,
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
    customer_products: normalizeCustomerProducts(ticket?.customer_products || ticket?.products || []),
    assignee: ticket?.assignee || null,
    status: ticket?.status || "active",
  };
}

function normalizeCustomerData(ticket = {}) {
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
    products: normalizeCustomerProducts(customer?.products || ticket?.products || customer?.customer_products || ticket?.customer_products || []),
  };
}

function mergeCurrentTicketProduct(products = [], ticket = {}) {
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
}

function TicketForm({ isOpen, onClose, selectedTicket, onAfterSave, menu_id }) {
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
  const ticket_id = getTicketIdentifier(selectedTicket);
  const visibleTabs = mode === "edit" ? TAB_ITEMS : TAB_ITEMS.filter(([key]) => key === "client");

  useEffect(() => {
    if (mode !== "edit" && tab !== "client") {
      setTab("client");
    }
  }, [mode, tab]);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!isOpen || !ticket_id) return;

      try {
        setFetchingTicket(true);
        const res = await makeRequest(`${ticketsModuleSchema.api.edit}/${ticket_id}`, {
          method: "GET",
        });
        const ticketData = res?.data || selectedTicket;
        const normalizedTicket = normalizeTaskData(ticketData);
        const normalizedCustomer = normalizeCustomerData(ticketData);
        const customerId = normalizedCustomer?.customer_id || normalizedTicket?.client_id;
        const detailedCustomer = customerId
          ? await loadCustomerDetails(customerId, normalizedCustomer)
          : normalizedCustomer;
        const normalizedDetailedCustomer = normalizeCustomerData({ ...ticketData, customer: detailedCustomer });
        const customerProducts = mergeCurrentTicketProduct(normalizedDetailedCustomer.customer_products, normalizedTicket);
        setFormData({
          ...normalizedTicket,
          customer_products: customerProducts,
        });
        setOldFormData(normalizedTicket);
        setSelectedCustomer({
          ...normalizedDetailedCustomer,
          customer_products: customerProducts,
          products: customerProducts,
        });
      } catch (error) {
        toast.error("Unable to fetch ticket details");
        setFormData(normalizeTaskData(selectedTicket));
        setOldFormData(normalizeTaskData(selectedTicket));
        setSelectedCustomer(normalizeCustomerData(selectedTicket));
      } finally {
        setFetchingTicket(false);
      }
    };

    if (selectedTicket && isOpen) {
      fetchTicketDetails();
      return;
    }

    setFormData(ticketsModuleSchema.form.initialValues);
    setOldFormData(ticketsModuleSchema.form.initialValues);
    setSelectedCustomer({});
    setIsCustomerFormOpen(false);
    setNewCustomerInitialValues({});
    setPendingCustomerSelect(null);
    setErrors({});
    setTab("client");
  }, [selectedTicket, isOpen, ticket_id]);

  if (!isOpen) return null;

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
          };
        })()
        : {}),
      // title: name === "client_name" && !current.title ? value : current.title,
    }));
  };

  const loadCustomerDetails = async (customerId, fallback = {}) => {
    if (!customerId) return fallback;

    try {
      const res = await makeRequest(`${customerModuleSchema.api.edit}/${customerId}`, {
        method: "GET",
      });
      return {
        ...fallback,
        ...(res?.data || {}),
        customer_id: customerId,
      };
    } catch {
      return fallback;
    }
  };

  const handleObjectSelect = async (field, item = {}) => {
    if (field.name !== "client_id") return;
    const customer = item?.original || item || {};
    const customerId = customer?.customer_id;
    const detailedCustomer = customerId ? await loadCustomerDetails(customerId, customer) : {};
    const normalizedCustomer = normalizeCustomerData({ customer: detailedCustomer });
    const customerProducts = normalizeCustomerProducts(normalizedCustomer.customer_products);
    setSelectedCustomer(customerId ? { ...normalizedCustomer, customer_products: customerProducts, products: customerProducts } : {});
    setFormData((current) => ({
      ...current,
      contact_no: detailedCustomer?.mobile_no || "",
      contact_person: detailedCustomer?.contact_person || current.contact_person || "",
      ...(String(current.client_id || "") !== String(customerId || "")
        ? {
          product_id: null,
          product_name: null,
          product_serial_number: null,
        }
        : {}),
      customer_products: customerProducts,
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
      const detailRes = await makeRequest(`${customerModuleSchema.api.edit}/${customerId}`, {
        method: "GET",
      });
      return {
        ...payload,
        ...(detailRes?.data || responseCustomer || {}),
        customer_id: customerId,
      };
    }

    if (payload?.name) {
      const searchRes = await makeRequest("/system/searchList", {
        method: "POST",
        body: JSON.stringify({
          text: payload.name,
          system: "new",
          tableName: "customer",
          wherec: "name",
          list: "customer_id,name,created_date,mobile_no,email,contact_person",
          curpage: 0,
        }),
      });
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
      const normalizedCustomer = normalizeCustomerData({ customer });
      const customerProducts = normalizeCustomerProducts(normalizedCustomer.customer_products);
      setSelectedCustomer({
        ...normalizedCustomer,
        customer_products: customerProducts,
        products: customerProducts,
      });
      setFormData((current) => ({
        ...current,
        client_id: customer.customer_id,
        contact_no: customer.mobile_no || "",
        contact_person: customer.contact_person || current.contact_person || "",
        product_id: null,
        product_name: null,
        product_serial_number: null,
        customer_products: customerProducts,
      }));
    } catch (error) {
      toast.error(error.message || "Unable to load saved customer");
    } finally {
      setPendingCustomerSelect(null);
      setNewCustomerInitialValues({});
    }
  };

  const handleSave = async () => {
    const {
      customer_products,
      ...ticketPayload
    } = formData;
    const payload = {
      ...ticketPayload,
      title: formData.title || formData.client_name,
    };

    const result = ticketsModuleSchema.validationSchema.safeParse(payload);

    if (!result.success) {
      const newErrors = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      const saveUrl =
        mode === "create"
          ? ticketsModuleSchema.api.create
          : `${ticketsModuleSchema.api.edit}/${ticket_id}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success(
          res?.message ||
          `Ticket ${mode === "create" ? "created" : "updated"} successfully`
        );
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
  return (
    <>
      <FlyoutPanel
        isOpen={isOpen}
        onClose={handleClose}
        title={selectedTicket ? "Edit Ticket" : "Create Ticket"}
        closeButton={
          <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
            <X size={18} />
          </button>
        }
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <ActionButton
              disabled={loading || fetchingTicket}
              variant="flyoutSecondary"
              onClick={handleClose}
            >
              Cancel
            </ActionButton>
            <ActionButton
              className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
              disabled={loading || fetchingTicket}
              variant="flyoutSecondary"
              onClick={handleSave}
            >
              {loading || fetchingTicket ? <Spinner /> : null} Save
            </ActionButton>
          </div>
        }
      >
        <div className="flyout-form-shell ticket-form-shell">
          <div className="ws-main-container">
            {fetchingTicket ? (<div className="p-5 text-center"> <Spinner /> </div>)
              : (
                <div className="ticket-drawer-layout grid grid-cols-12 overflow-hidden rounded-xl bg-white">
                  <div className="ticket-scroll-pane col-span-12 min-w-0 overflow-y-auto border-r border-slate-200 px-4 py-2 lg:col-span-6 xl:col-span-7">
                    {mode === "edit" && <p className="text-[14px] text-slate-500 w-full text-end " ><span className="bg-gray-50 p-1">Ticket No : {formData.ticket_no}</span></p>}
                    <DynamicModuleForm
                      sections={ticketsModuleSchema.form.sections}
                      values={formData}
                      onChange={handleChange}
                      onObjectSelect={handleObjectSelect}
                      addNewHandlers={{
                        client_id: openCustomerCreate,
                      }}
                      errors={errors}
                      mode={mode}
                      oldValues={oldformData}
                      menuId={menu_id}
                    />
                  </div>
                  <div className="col-span-12 flex min-h-60 min-w-0 flex-col overflow-hidden bg-slate-50 lg:col-span-6 xl:col-span-5">
                    <div className="border-b border-slate-200 bg-white px-4 py-2">
                      <div className="ticket-scroll-pane flex items-center gap-6 overflow-x-auto">
                        {visibleTabs.map(([key, label]) => (
                          <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 text-xs font-semibold ${tab === key ? "border-b-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className={`min-h-0 flex-1 min-w-0 ${tab === "client" ? "overflow-hidden" : "ticket-scroll-pane overflow-y-auto p-2"}`}>
                      {tab === "client" && (
                        <div className="flex h-full min-h-0 flex-col overflow-hidden">
                          <div className="min-h-0 flex-1 overflow-hidden">
                            <ClientHistory openedTiket={ticket_id} client={selectedCustomer} />
                          </div>
                        </div>
                      )}
                      {tab === "history" && mode === "edit" && <TicketHistory ticket_id={ticket_id} />}
                      {tab === "comments" && mode === "edit" && <Comments module="tickets" client={selectedCustomer} ticket_id={ticket_id} />}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </FlyoutPanel>
      <CustomerForm
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setPendingCustomerSelect(null);
          setNewCustomerInitialValues({});
        }}
        selectedCustomer={null}
        initialValues={newCustomerInitialValues}
        onAfterSave={handleCustomerSaved}
        menu_id={customerModuleSchema.menu_id}
      />
    </>
  );
}

export default TicketForm;
