import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, History, Mail, CheckCircle2, PhoneCall, X } from "lucide-react";
import { toast } from "react-toastify";
// import { CalendarPlus, CheckCircle2, Clock, MapPin, X } from "lucide-react";


import { fetchAmcActivity, fetchAmcReminderCustomers, makeAmcCallTicket, scheduleAmcVisit, markVisited, sendAmcReminder } from "../../api/amcReminderController";
import useMenuPermissions from "../../auth/useMenuPermissions";
import ActionButton from "../../components/ui/ActionButton";
import DynamicFilter from "../../components/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import Spinner from "../../components/ui/Spinner";
import { useModuleFilters } from "../../store/hooks";
import { defaultSortConfig, getNextSortConfig } from "../../utils/sorting";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import { amcReminderFallbackColumns, amcReminderModuleSchema } from "./data/module.schema";

const filterFields = [
  { label: "Customer", value: "name", type: "text" },
  { label: "Email", value: "email", type: "text" },
  { label: "Mobile No", value: "mobile_no", type: "text" },
  { label: "Company", value: "company_name", type: "text" },
  { label: "AMC Expiry", value: "amc_end_date", type: "date" },
  { label: "Expected Calls", value: "expected_call_count", type: "number" },
  { label: "Done Calls", value: "done_amc_call_count", type: "number" },
  { label: "Remaining Calls", value: "remaining_call_count", type: "number" },
  { label: "AMC Tickets", value: "amc_ticket_count", type: "number" },
  { label: "Visits", value: "amc_visit_scheduled_count", type: "number" },
  { label: "Visited", value: "amc_visited_count", type: "number" },
];

function getRowIdentifier(row, index) {
  return row?.customer_id || row?.id || row?.client_id || `amc-reminder-${index}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderDaysLeft(value) {
  if (value === null || value === undefined || value === "") return "-";

  const days = Number(value);
  const className =
    days < 0
      ? "amc-expiry-chip expired"
      : days <= 15
        ? "amc-expiry-chip urgent"
        : days <= 30
          ? "amc-expiry-chip warning"
          : "amc-expiry-chip";

  return (
    <span className={className}>
      {days < 0 ? `${Math.abs(days)} overdue` : `${days} days`}
    </span>
  );
}

function renderCell(column, row, actions) {
  const value = row?.[column.key];

  if (column.key === "actions") {
    const customerId = row?.customer_id;
    const isSending = String(actions.sendingCustomerId || "") === String(customerId || "");
    const isCalling = String(actions.callingCustomerId || "") === String(customerId || "");
    const isActivityLoading = String(actions.activityLoadingCustomerId || "") === String(customerId || "");
    const sentToday = Boolean(Number(row?.sent_today || 0));

    return (
      <div className="amc-action-group">
        <ActionButton
          type="button"
          variant="ghostPrimary"
          className="amc-action-button"
          onClick={() => actions.onMakeCall(row)}
          disabled={!customerId || isCalling}
          title="Create AMC call ticket"
        >
          {isCalling ? <Spinner /> : <PhoneCall size={14} />}
          Make Call
        </ActionButton>
        <ActionButton
          type="button"
          variant="ghostPrimary"
          className="amc-action-button"
          onClick={() => actions.onOpenReminder(row)}
          disabled={!customerId || isSending || sentToday}
          title={sentToday ? "Reminder already sent today" : "Send AMC reminder"}
        >
          {isSending ? <Spinner /> : <Mail size={14} />}
          {sentToday ? "Sent" : "Reminder"}
        </ActionButton>
        <ActionButton
          type="button"
          variant="ghostPrimary"
          className="amc-action-button"
          onClick={() => actions.onAddVisit(row)}
          disabled={!customerId}
          title="Add AMC visit"
        >
          <CalendarPlus size={14} />
          Visit
        </ActionButton>
        <ActionButton
          type="button"
          variant="ghostPrimary"
          className="amc-action-button"
          onClick={() => actions.onOpenActivity(row)}
          disabled={!customerId || isActivityLoading}
          title="View AMC activity"
        >
          {isActivityLoading ? <Spinner /> : <History size={14} />}
          History
        </ActionButton>
      </div>
    );
  }

  if (column.key === "name") {
    return (
      <div className="person-cell">
        <span className="person-avatar avatar-2">{String(value || "?").charAt(0)}</span>
        <span className="text-overflow">{value || "-"}</span>
        <span className="table-amc-chip">AMC</span>
      </div>
    );
  }

  if (column.key === "email") {
    return <div className="text-overflow table-text-clip">{value || "-"}</div>;
  }

  if (column.key === "company_name") {
    return <span className="tag lilac text-overflow">{value || "-"}</span>;
  }

  if (column.key === "amc_start_date" || column.key === "amc_end_date" || column.key === "last_reminder_sent_at") {
    return formatDate(value);
  }

  if (column.key === "days_until_expiry") {
    return renderDaysLeft(value);
  }

  if (
    column.key === "support_call_count" ||
    column.key === "expected_call_count" ||
    column.key === "done_amc_call_count" ||
    column.key === "remaining_call_count" ||
    column.key === "amc_ticket_count" ||
    column.key === "amc_visit_scheduled_count" ||
    column.key === "amc_visited_count" ||
    column.key === "reminder_count"
  ) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  return value ?? "-";
}

function ReminderConfirmModal({ customer, includeReport, sending, onIncludeReportChange, onClose, onConfirm, }) {
  if (!customer) return null;
  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amc-reminder-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="amc-reminder-modal-title">Send AMC Reminder</h3>
            <p>{customer.name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose} disabled={sending}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-modal-body">
          <div className="amc-summary-grid">
            <div>
              <span>Email</span>
              <strong>{customer.email || "-"}</strong>
            </div>
            <div>
              <span>AMC Expiry</span>
              <strong>{formatDate(customer.amc_end_date)}</strong>
            </div>
            <div>
              <span>Support Calls</span>
              <strong>{Number(customer.support_call_count || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Previous Reminders</span>
              <strong>{Number(customer.reminder_count || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Previous Reminder Date</span>
              <strong>{formatDate(customer.last_reminder_sent_at)}</strong>
            </div>
          </div>

          <label className="amc-report-toggle">
            <input
              type="checkbox"
              checked={includeReport}
              onChange={(event) => onIncludeReportChange(event.target.checked)}
              disabled={sending}
            />
            <span>
              <strong>Include report</strong>
              <small>Attach Excel support-call report for this AMC period.</small>
            </span>
          </label>
        </div>

        <div className="amc-modal-actions">
          <ActionButton type="button" onClick={onClose} disabled={sending}>
            Cancel
          </ActionButton>
          <ActionButton type="button" variant="primary" onClick={onConfirm} disabled={sending || !customer.email}>
            {sending ? <Spinner /> : <Mail size={15} />}
            Send Reminder
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function toLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toMysqlDateTime(value = "") {
  if (!value) return "";
  return `${value.replace("T", " ")}:00`;
}

function VisitScheduleModal({ customer, formData, scheduling, onChange, onClose, onConfirm }) {
  if (!customer) return null;

  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amc-visit-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="amc-visit-modal-title">Schedule AMC Visit</h3>
            <p>{customer.name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose} disabled={scheduling}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-modal-body">
          <label className="amc-modal-field">
            <span>Visit Date & Time</span>
            <input
              type="datetime-local"
              value={formData.visit_scheduled_at}
              onChange={(event) => onChange("visit_scheduled_at", event.target.value)}
              disabled={scheduling}
            />
          </label>
          <label className="amc-modal-field">
            <span>Visit Details</span>
            <textarea
              value={formData.visit_details}
              onChange={(event) => onChange("visit_details", event.target.value)}
              placeholder="Enter visit details"
              disabled={scheduling}
            />
          </label>
        </div>

        <div className="amc-modal-actions">
          <ActionButton type="button" onClick={onClose} disabled={scheduling}>
            Cancel
          </ActionButton>
          <ActionButton type="button" variant="primary" onClick={onConfirm} disabled={scheduling || !formData.visit_scheduled_at}>
            {scheduling ? <Spinner /> : <CalendarPlus size={15} />}
            Schedule Visit
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function isPastScheduledTime(value = "") {
  if (!value) return false;
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return false;
  return new Date() >= date;
}

function ActivityList({ rows = [], emptyText, render }) {
  if (!rows.length) {
    return <div className="amc-activity-empty">{emptyText}</div>;
  }

  return <div className="amc-activity-list">{rows.map(render)}</div>;
}

function ActivityModal({ customer, activity, activeTab, onTabChange, onClose, onRefresh }) {
  if (!customer) return null;

  const tabs = [
    ["calls", `Calls (${activity?.calls?.length || 0})`],
    ["visits", `Visits (${activity?.visits?.length || 0})`],
    // ["tickets", `Tickets (${activity?.tickets?.length || 0})`],
    ["reminders", `Reminders (${activity?.reminders?.length || 0})`],
  ];
  const handleMarkVisited = async (visit) => {
    if (!visit?.visit_id) return;
    if (!visit.visit_details || !visit.visit_details === "") {
      toast.error("Visit details should`nt empty!");
      return;
    }
    try {
      const res = await markVisited({ visit });
      if (res?.success) {
        toast.success(res?.message || "Visit marked as visited");
        await onRefresh();
        return;
      }
      toast.error(res?.message || res?.msg || "Unable to update visit");
    } catch (error) {
      toast.error(error.message || "Unable to update visit");
    }
  };

  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal amc-activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amc-activity-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="amc-activity-modal-title">AMC Activity</h3>
            <p>{customer.name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-activity-tabs">
          {tabs.map(([key, label]) => (
            <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => onTabChange(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="amc-modal-body">
          {activeTab === "calls" ? (
            <ActivityList
              rows={activity?.calls || []}
              emptyText="No AMC calls yet"
              render={(row) => (
                <div key={row.ticket_id} className="amc-activity-item">
                  <strong>{row.ticket_no || `Ticket #${row.ticket_id}`}</strong>
                  <span>{formatDateTime(row.created_date)} | {row.ticket_status || "-"}</span>
                  <p>{row.description || "-"}</p>
                </div>
              )}
            />
          ) : null}

          {activeTab === "visits" ? (
            <ActivityList
              rows={activity?.visits || []}
              emptyText="No AMC visits yet"
              render={(row) => (
                <div key={row.visit_id} className="amc-activity-item relative">
                  <strong>{row.ticket_no || `Ticket #${row.ticket_id}`} | {row.visit_status || "scheduled"}</strong>
                  <span>Scheduled: {formatDateTime(row.visit_scheduled_at)} | Visited: {formatDateTime(row.visited_at)}</span>
                  <p>{row.visit_details || "-"}</p>
                  {/* { row.visit_status !== "visited" &&
                    <div className="flex justify-end absolute right-1.5 bottom-1.5">
                      <button
                        type="button"
                        onClick={() => handleMarkVisited(row)}
                        disabled={!isPastScheduledTime(row.visit_scheduled_at)}
                        title={isPastScheduledTime(row.visit_scheduled_at) ? "Mark visit as completed" : "Visit can be marked after scheduled time"}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <CheckCircle2 size={13} />
                        Mark Visited
                      </button>
                    </div>
                  } */}
                </div>
              )}
            />
          ) : null}

          {activeTab === "tickets" ? (
            <ActivityList
              rows={activity?.tickets || []}
              emptyText="No AMC tickets yet"
              render={(row) => (
                <div key={row.ticket_id} className="amc-activity-item">
                  <strong>{row.ticket_no || `Ticket #${row.ticket_id}`} | {row.ticket_status || "-"}</strong>
                  <span>{formatDateTime(row.created_date)} | {row.query_type || "-"}</span>
                  <p>{row.description || "-"}</p>
                </div>
              )}
            />
          ) : null}

          {activeTab === "reminders" ? (
            <ActivityList
              rows={activity?.reminders || []}
              emptyText="No reminders yet"
              render={(row) => (
                <div key={row.reminder_id} className="amc-activity-item">
                  <strong>{row.email_subject || "AMC Reminder"} | {row.status || "-"}</strong>
                  <span>{formatDateTime(row.sent_at)} | Report: {row.include_report || "no"}</span>
                  <p>{row.recipient_email || "-"}</p>
                </div>
              )}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AmcRemindersModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || amcReminderModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const canSendReminder = permissions.canAdd || permissions.canEdit;

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [includeReport, setIncludeReport] = useState(false);
  const [sendingCustomerId, setSendingCustomerId] = useState(null);
  const [callingCustomerId, setCallingCustomerId] = useState(null);
  const [visitCustomer, setVisitCustomer] = useState(null);
  const [schedulingVisitCustomerId, setSchedulingVisitCustomerId] = useState(null);
  const [activityCustomer, setActivityCustomer] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityTab, setActivityTab] = useState("calls");
  const [activityLoadingCustomerId, setActivityLoadingCustomerId] = useState(null);
  const [visitFormData, setVisitFormData] = useState({
    visit_scheduled_at: toLocalDateTimeInputValue(),
    visit_details: "",
  });

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "amc-reminders",
    customers
  );

  const effectiveOrderBy = !filterState.order_by || filterState.order_by === defaultSortConfig.key ? "remaining_call_count" : filterState.order_by;
  const effectiveOrder = !filterState.order_by || filterState.order_by === defaultSortConfig.key ? "DESC" : filterState.order || "DESC";

  const sortConfig = {
    key: effectiveOrderBy,
    direction: String(effectiveOrder).toLowerCase(),
  };

  const defaultVisibleColumnKeys = useMemo(
    () => amcReminderFallbackColumns.map((column) => column.key),
    []
  );

  const getReminderList = async () => {
    setLoading(true);

    const response = await fetchAmcReminderCustomers({
      page,
      searchText: filterState.searchText,
      filters: filterState.filters,
      order: effectiveOrder,
      order_by: effectiveOrderBy,
    });

    setLoading(false);

    if (response?.success) {
      setCustomers(response.data || []);
      setPagination(response.pagination || {});
      return;
    }

    toast.error(response?.message || "Error while fetching AMC reminders");
  };

  const openReminderModal = (customer) => {
    if (!canSendReminder) {
      toast.error("You do not have permission to send reminders.");
      return;
    }

    if (!customer?.email) {
      toast.error("Customer email is required before sending reminder.");
      return;
    }

    if (Number(customer?.sent_today || 0)) {
      toast.error("Reminder already sent today for this customer.");
      return;
    }

    setSelectedCustomer(customer);
    setIncludeReport(false);
  };

  const closeReminderModal = () => {
    if (sendingCustomerId) return;

    setSelectedCustomer(null);
    setIncludeReport(false);
  };

  const handleSendReminder = async () => {
    const customerId = selectedCustomer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    setSendingCustomerId(customerId);

    const response = await sendAmcReminder({
      customerId,
      includeReport,
    });

    setSendingCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC reminder sent successfully.");
      setSelectedCustomer(null);
      setIncludeReport(false);
      await getReminderList();
      return;
    }

    toast.error(response?.message || "Unable to send AMC reminder.");
  };

  const handleMakeCall = async (customer) => {
    const customerId = customer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    if (!canSendReminder) {
      toast.error("You do not have permission to create AMC calls.");
      return;
    }

    setCallingCustomerId(customerId);

    const response = await makeAmcCallTicket({ customer });

    setCallingCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC call ticket created successfully.");
      await getReminderList();
      return;
    }

    toast.error(response?.message || response?.msg || "Unable to create AMC call ticket.");
  };

  const handleAddVisit = (customer) => {
    if (!canSendReminder) {
      toast.error("You do not have permission to schedule AMC visits.");
      return;
    }

    setVisitCustomer(customer);
    setVisitFormData({
      visit_scheduled_at: toLocalDateTimeInputValue(),
      visit_details: "",
    });
  };

  const closeVisitModal = () => {
    if (schedulingVisitCustomerId) return;
    setVisitCustomer(null);
  };

  const handleVisitFieldChange = (field, value) => {
    setVisitFormData((current) => ({ ...current, [field]: value }));
  };

  const handleScheduleVisit = async () => {
    const customerId = visitCustomer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }
    if (!visitFormData.visit_details) {
      toast.error("Visit details required!");
      return;
    }

    setSchedulingVisitCustomerId(customerId);

    const response = await scheduleAmcVisit({
      customer: visitCustomer,
      visitScheduledAt: toMysqlDateTime(visitFormData.visit_scheduled_at),
      visitDetails: visitFormData.visit_details,
    });

    setSchedulingVisitCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC visit scheduled successfully.");
      setVisitCustomer(null);
      await getReminderList();
      return;
    }

    toast.error(response?.message || response?.msg || "Unable to schedule AMC visit.");
  };
  const handleOpenActivity = async (customer) => {
    const customerId = customer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    setActivityLoadingCustomerId(customerId);
    const response = await fetchAmcActivity({ customerId });
    setActivityLoadingCustomerId(null);

    if (response?.success) {
      setActivityCustomer(customer);
      setActivityData(response.data || {});
      setActivityTab("calls");
      return;
    }

    toast.error(response?.message || "Unable to fetch AMC activity.");
  };

  const refreshActivity = async () => {
    const customerId = activityCustomer?.customer_id;
    if (!customerId) return;

    const response = await fetchAmcActivity({ customerId });

    if (response?.success) {
      setActivityData(response.data || {});
      await getReminderList();
      return;
    }

    toast.error(response?.message || "Unable to refresh AMC activity.");
  };

  const closeActivityModal = () => {
    setActivityCustomer(null);
    setActivityData(null);
    setActivityTab("calls");
  };

  useEffect(() => {
    getReminderList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={amcReminderModuleSchema.title}
        description={amcReminderModuleSchema.description}
        controls={
          <ModuleControls
            loading={loading}
            onRefresh={getReminderList}
            showTraditional
            canCreate={false}
            canDelete={false}
            filter={
              <DynamicFilter
                fields={filterFields}
                savedFilters={amcReminderModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={amcReminderFallbackColumns}
            rows={customers}
            storageKey="amc-reminders-module-column-widths-v2"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            allowSelection={false}
            sortConfig={sortConfig}
            onSortChange={(columnKey) => {
              if (columnKey === "actions") return;
              const nextSort = getNextSortConfig(sortConfig, columnKey);
              if (page !== 1) {
                setPage(1);
              }
              setSort({
                order_by: nextSort.key,
                order: nextSort.direction.toUpperCase(),
              });
            }}
            renderRow={(row, index, columns) => (
              <tr key={getRowIdentifier(row, index)} className="group">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.key === "actions" ? "amc-action-cell" : column.className || ""}
                    style={{
                      width: column.currentWidth,
                      minWidth: column.currentWidth,
                      maxWidth: column.currentWidth,
                    }}
                  >
                    {renderCell(column, row, {
                      onOpenReminder: openReminderModal,
                      onMakeCall: handleMakeCall,
                      onAddVisit: handleAddVisit,
                      onOpenActivity: handleOpenActivity,
                      sendingCustomerId,
                      callingCustomerId,
                      activityLoadingCustomerId,
                    })}
                  </td>
                ))}
              </tr>
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={setPage} />}
      />

      <ReminderConfirmModal
        customer={selectedCustomer}
        includeReport={includeReport}
        sending={Boolean(sendingCustomerId)}
        onIncludeReportChange={setIncludeReport}
        onClose={closeReminderModal}
        onConfirm={handleSendReminder}
      />
      <VisitScheduleModal
        customer={visitCustomer}
        formData={visitFormData}
        scheduling={Boolean(schedulingVisitCustomerId)}
        onChange={handleVisitFieldChange}
        onClose={closeVisitModal}
        onConfirm={handleScheduleVisit}
      />
      <ActivityModal
        onRefresh={refreshActivity}
        customer={activityCustomer}
        activity={activityData}
        activeTab={activityTab}
        onTabChange={setActivityTab}
        onClose={closeActivityModal}
      />
    </>
  );
}

export default AmcRemindersModulePage;
