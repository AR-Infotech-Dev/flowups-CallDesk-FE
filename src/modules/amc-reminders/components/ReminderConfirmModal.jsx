import { Mail, X } from "lucide-react";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import { formatDate } from "../utils/amcReimders.utils";

function ReminderConfirmModal({
  customer,
  includeReport,
  sending,
  onIncludeReportChange,
  onClose,
  onConfirm,
}) {
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

export default ReminderConfirmModal;
