import { BriefcaseBusiness, Clock3, History, MessageSquareText, Route, X } from "lucide-react";
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

const TAB_ITEMS = [
  ["client", "Client History", BriefcaseBusiness],
  ["comments", "Comments", MessageSquareText],
  ["work_logs", "Work Log", Clock3],
  ["visits", "Visits", Route],
  ["history", "Ticket History", History],
];

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
        subtitle={formData.ticket_no && <p className="text-[14px] text-slate-500 w-full text-end"><span className="bg-gray-50 p-1">#{formData.ticket_no}</span></p>}
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
