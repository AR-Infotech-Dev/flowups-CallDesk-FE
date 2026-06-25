import { PhoneCall, X } from "lucide-react";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";

function CallDescriptionModal({ customer, description, saving, onChange, onClose, onConfirm }) {
  if (!customer) return null;

  const trimmedDescription = String(description || "").trim();

  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amc-call-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="amc-call-modal-title">Register AMC Call</h3>
            <p>{customer.name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose} disabled={saving}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-modal-body">
          <label className="amc-modal-field">
            <span>Call Description</span>
            <textarea
              value={description}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Enter call description"
              disabled={saving}
            />
          </label>
        </div>

        <div className="amc-modal-actions">
          <ActionButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={saving || !trimmedDescription}
          >
            {saving ? <Spinner /> : <PhoneCall size={15} />}
            Register Call
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default CallDescriptionModal;
