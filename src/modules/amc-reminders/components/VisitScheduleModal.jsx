import { CalendarPlus, X } from "lucide-react";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";

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

export default VisitScheduleModal;
