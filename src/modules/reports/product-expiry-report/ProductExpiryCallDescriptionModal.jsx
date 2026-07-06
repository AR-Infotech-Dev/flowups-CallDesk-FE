import { Phone, X } from "lucide-react";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";

function ProductExpiryCallDescriptionModal({
  row,
  description,
  saving,
  onChange,
  onClose,
  onConfirm,
}) {
  if (!row) return null;

  const trimmedDescription = String(description || "").trim();

  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-expiry-call-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="product-expiry-call-modal-title">Register Product Call</h3>
            <p>{row.customer_name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose} disabled={saving}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-modal-body">
          <div className="product-expiry-call-summary">
            <strong>{row.product_name || "-"}</strong>
            <span>{row.serial_number || "-"} | Expiry: {row.expiry_date || "-"}</span>
          </div>
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
            {saving ? <Spinner /> : <Phone size={15} />}
            Register Call
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default ProductExpiryCallDescriptionModal;
