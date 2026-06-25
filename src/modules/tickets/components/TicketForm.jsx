import { BriefcaseBusiness, Clock3, History, MessageSquareText, Route, UserPlus, X } from "lucide-react";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import CustomerForm from "@modules/customer/components/CustomerForm";
import { ticketsModuleSchema } from "../data/module.schema";
import { useTicketForm } from "../hooks/useTicketForm";
import ClientHistory from "./ClientHistory";
import Comments from "./Comments";
import TicketHistory from "./TicketHistory";
import Visits from "./Visits";
import WorkLogs from "./WorkLogs";
import { findCustomerContactByMobile, normalizeMobileNumber } from "../utils/ticketForm.utils";

const TAB_ITEMS = [
  ["client", "Client History", BriefcaseBusiness],
  ["comments", "Comments", MessageSquareText],
  ["work_logs", "Work Log", Clock3],
  ["visits", "Visits", Route],
  ["history", "Ticket History", History],
];

const CONTACT_SECTION_INDEX = ticketsModuleSchema.form.sections.findIndex((section) =>
  section.fields?.some((field) => field.name === "contact_no")
);
const FORM_SECTIONS_BEFORE_CONTACT = CONTACT_SECTION_INDEX >= 0
  ? ticketsModuleSchema.form.sections.slice(0, CONTACT_SECTION_INDEX + 1)
  : ticketsModuleSchema.form.sections;
const FORM_SECTIONS_AFTER_CONTACT = CONTACT_SECTION_INDEX >= 0
  ? ticketsModuleSchema.form.sections.slice(CONTACT_SECTION_INDEX + 1)
  : [];

function QuickAddContactPanel({ formData = {}, errors = {}, onChange }) {
  const mobile = normalizeMobileNumber(formData.contact_no);
  const hasCustomer = Boolean(formData.client_id);
  const matchedContact = findCustomerContactByMobile(formData.customer_contacts || formData.contact_persons, mobile);
  const shouldShow = hasCustomer && mobile.length === 10 && !matchedContact && !formData.ticket_id;

  if (!shouldShow) return null;

  const details = formData.contact_details || {};
  const fieldError = errors["contact_details.name"] || errors["contact_details.mobile_no"] || errors["contact_details.email"] || errors.contact_details;

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-full bg-blue-600 p-1.5 text-white">
            <UserPlus size={14} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">New contact for this customer</p>
            <p className="text-xs text-slate-500">No contact found for {mobile}. It will be saved after ticket create.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            name="save_contact"
            checked={Boolean(formData.save_contact)}
            onChange={onChange}
          />
          Add
        </label>
      </div>

      {formData.save_contact && (
        <div className="grid grid-cols-12 gap-3">
          <label className="col-span-12 flex flex-col gap-1 md:col-span-6">
            <span className="text-xs font-medium text-slate-600">Contact Name *</span>
            <input
              name="name"
              value={details.name || ""}
              onChange={onChange}
              className="rounded border border-blue-100 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter contact name"
            />
          </label>
          <label className="col-span-12 flex flex-col gap-1 md:col-span-6">
            <span className="text-xs font-medium text-slate-600">Mobile</span>
            <input
              name="mobile_no"
              value={mobile}
              readOnly
              className="rounded border border-blue-100 bg-slate-50 px-3 py-1.5 text-sm text-slate-500"
            />
          </label>
          <label className="col-span-12 flex flex-col gap-1 md:col-span-6">
            <span className="text-xs font-medium text-slate-600">Designation</span>
            <input
              name="designation"
              value={details.designation || ""}
              onChange={onChange}
              className="rounded border border-blue-100 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Optional"
            />
          </label>
          <label className="col-span-12 flex flex-col gap-1 md:col-span-6">
            <span className="text-xs font-medium text-slate-600">Email</span>
            <input
              name="email"
              value={details.email || ""}
              onChange={onChange}
              className="rounded border border-blue-100 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Optional"
            />
          </label>
          <label className="col-span-12 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Department</span>
            <input
              name="department"
              value={details.department || ""}
              onChange={onChange}
              className="rounded border border-blue-100 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Optional"
            />
          </label>
          {fieldError && <p className="col-span-12 text-xs font-medium text-red-500">{fieldError}</p>}
        </div>
      )}
    </div>
  );
}

function TicketForm({ isOpen, onClose, selectedTicket, onAfterSave, menu_id }) {
  const {
    customerMenuId,
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
    handleQuickContactChange,
    handleObjectSelect,
    openCustomerCreate,
    handleCustomerSaved,
    handleSave,
    closeCustomerForm,
    fetchTicketDetails
  } = useTicketForm({ isOpen, onClose, selectedTicket, onAfterSave });

  const afterWorkLogSave = () => {
    onAfterSave();
    fetchTicketDetails()
  }
  const visibleTabs =
    mode === "edit"
      ? TAB_ITEMS.filter(([key]) => {
        if (key === "visits") {
          return formData.visit_required === "y";
        }
        return true;
      })
      : TAB_ITEMS.filter(([key]) => key === "client");

  if (!isOpen) return null;

  return (
    <>
      <FlyoutPanel
        isOpen={isOpen}
        onClose={handleClose}
        title={selectedTicket ? "Edit Ticket" : "Create Ticket"}
        subtitle={formData.ticket_no && <span className="block w-full text-end text-[14px] text-slate-500"><span className="bg-gray-50 p-1">#{formData.ticket_no}</span></span>}
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
            {fetchingTicket ? (
              <div className="p-5 text-center">
                <Spinner />
              </div>
            ) : (
              <div className="ticket-drawer-layout grid grid-cols-12 overflow-hidden rounded-xl bg-white">
                <div className="ticket-scroll-pane col-span-12 min-w-0 overflow-y-auto border-r border-slate-200 px-4 py-2 lg:col-span-6 xl:col-span-7">
                  <DynamicModuleForm
                    sections={FORM_SECTIONS_BEFORE_CONTACT}
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
                  <QuickAddContactPanel
                    formData={formData}
                    errors={errors}
                    onChange={handleQuickContactChange}
                  />
                  {FORM_SECTIONS_AFTER_CONTACT.length > 0 && (
                    <DynamicModuleForm
                      sections={FORM_SECTIONS_AFTER_CONTACT}
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
                  )}
                </div>
                <div className="col-span-12 flex min-h-60 min-w-0 flex-col overflow-hidden bg-slate-50 lg:col-span-6 xl:col-span-5">
                  <div className="border-b border-slate-200 bg-white px-4 py-2">
                    <div className="flex items-center gap-4 overflow-visible">
                      {visibleTabs.map(([key, label, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTab(key)}
                          className={`ticket-tab-icon-button ${tab === key ? "active" : ""}`}
                          aria-label={label}
                          data-tooltip={label}
                        >
                          <Icon size={17} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`min-h-0 flex-1 min-w-0 ${tab === "client" ? "overflow-hidden" : "ticket-scroll-pane overflow-y-auto p-2"}`}>
                    {tab === "client" && (
                      <div className="flex h-full min-h-0 flex-col overflow-hidden">
                        <div className="min-h-0 flex-1 overflow-hidden">
                          <ClientHistory openedTiket={ticketId} client={selectedCustomer} />
                        </div>
                      </div>
                    )}
                    {tab === "history" && mode === "edit" && <TicketHistory ticket_id={ticketId} />}
                    {tab === "comments" && mode === "edit" && <Comments module="tickets" client={selectedCustomer} ticket_id={ticketId} />}
                    {tab === "work_logs" && mode === "edit" && <WorkLogs ticket={formData} ticket_id={ticketId} onAfterSave={afterWorkLogSave} />}
                    {tab === "visits" && mode === "edit" && formData.visit_required === "y" && <Visits ticket={formData} ticket_id={ticketId} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </FlyoutPanel>
      <CustomerForm
        isOpen={isCustomerFormOpen}
        onClose={closeCustomerForm}
        selectedCustomer={null}
        initialValues={newCustomerInitialValues}
        onAfterSave={handleCustomerSaved}
        menu_id={customerMenuId}
      />
    </>
  );
}

export default TicketForm;
