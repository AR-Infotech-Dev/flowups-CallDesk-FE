import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Contact, Package, Phone, UserRound, X } from "lucide-react";

const stripHtml = (value = "") =>
  String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatResolution = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return `${value} hrs`;
};

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="ticket-preview-field">
      <div className="ticket-preview-label">
        {Icon ? <Icon size={13} /> : null}
        {label}
      </div>
      <div className="ticket-preview-value">{value || "-"}</div>
    </div>
  );
}

function TicketPreview({ isOpen, handleClose, selectedTicket = {} }) {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (popupRef.current?.contains(event.target)) return;
      handleClose?.();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") handleClose?.();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="ticket-preview-popover"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="ticket-preview-popover-head">
        <div>
          <span>Ticket Details</span>
          <strong>{selectedTicket.ticket_no || "-"}</strong>
        </div>
        <button type="button" onClick={handleClose} aria-label="Close ticket details">
          <X size={15} />
        </button>
      </div>

      <div className="ticket-preview-shell ticket-preview-shell-popover">
        <div className="ticket-preview-mini-hero">
          <strong>{selectedTicket.customer_name || "-"}</strong>
          <div className="ticket-preview-status">
            <span>{selectedTicket.ticket_status || "-"}</span>
            <small>{selectedTicket.ticket_priority || "No priority"}</small>
          </div>
        </div>

        <div className="ticket-preview-grid">
          <div>
            <DetailItem icon={UserRound} label="Assignee" value={selectedTicket.assignee_name} />
          </div>
          <div>
            <DetailItem icon={Contact} label="Contact Person" value={selectedTicket.contact_person} />
          </div>
          <div>
            <DetailItem icon={Phone} label="Contact Number" value={selectedTicket.contact_no} />
          </div>
          <div>
            <DetailItem icon={CalendarDays} label="Assigned" value={formatDate(selectedTicket.assigned_date || selectedTicket.created_date)} />
          </div>
          <div>
            <DetailItem icon={CalendarDays} label="Due" value={formatDate(selectedTicket.due_date)} />
          </div>
          <div>
            <DetailItem icon={CalendarDays} label="Resolution" value={formatResolution(selectedTicket.resolution_time)} />
          </div>
          <div>
            <DetailItem icon={Package} label="Product" value={[selectedTicket.product_name, selectedTicket.product_serial_number].filter(Boolean).join(" | ")} />
          </div>
        </div>

        <div className="ticket-preview-description">
          <div>Description</div>
          <p>
            {stripHtml(selectedTicket.description) || "-"}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TicketPreview;
