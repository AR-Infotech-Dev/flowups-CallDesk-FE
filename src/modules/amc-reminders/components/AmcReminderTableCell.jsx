import { CalendarPlus, History, Mail, PhoneCall } from "lucide-react";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import { formatDate, getDaysLeftClassName } from "../utils/amcReimders.utils";

function renderDaysLeft(value) {
  if (value === null || value === undefined || value === "") return "-";

  const days = Number(value);

  return (
    <span className={getDaysLeftClassName(value)}>
      {days < 0 ? `${Math.abs(days)} overdue` : `${days} days`}
    </span>
  );
}

function renderActions(row, actions) {
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

export function renderAmcReminderCell(column, row, actions) {
  const value = row?.[column.key];

  if (column.key === "actions") {
    return renderActions(row, actions);
  }

  if (column.key === "name") {
    return (
      <div className="person-cell w-full justify-between">
        <div className="flex gap-1.5 items-center">
          <span className="person-avatar avatar-2">{String(value || "?").charAt(0)}</span>
          <span className="text-overflow">{value || "-"}</span>
        </div>
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
