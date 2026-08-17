import { CalendarClock, ChevronRight } from "lucide-react";

const formatFollowupDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export function QuotationFollowups({ items = [], adminView, onOpen }) {
  if (!items.length) {
    return <div className="quotation-followup-widget-empty"><CalendarClock size={22} /><span>No pending quotation follow-ups.</span></div>;
  }

  return (
    <div className="quotation-followup-widget-list">
      {items.map((item) => (
        <button key={item.followup_id} type="button" className="quotation-followup-widget-row" onClick={() => onOpen?.(item)}>
          <div className={`quotation-followup-widget-icon ${item.due_state}`}><CalendarClock size={15} /></div>
          <div className="quotation-followup-widget-main">
            <div className="quotation-followup-widget-number">{item.quotation_no}</div>
            <div className="quotation-followup-widget-party">{item.party_name}</div>
            {adminView && item.assigned_to_name ? <div className="quotation-followup-widget-assignee">Assigned to: {item.assigned_to_name}</div> : null}
          </div>
          <div className="quotation-followup-widget-due">
            <div className={`quotation-followup-widget-state ${item.due_state}`}>{item.due_state}</div>
            <div className="quotation-followup-widget-date">{formatFollowupDate(item.followup_date)}</div>
          </div>
          <ChevronRight className="quotation-followup-widget-arrow" size={14} />
        </button>
      ))}
    </div>
  );
}
