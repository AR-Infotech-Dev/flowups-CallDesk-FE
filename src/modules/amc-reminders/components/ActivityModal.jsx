import { X } from "lucide-react";
import ActivityList from "./ActivityList";
import { formatDateTime } from "../utils/amcReimders.utils";

function ActivityModal({ customer, activity, activeTab, onTabChange, onClose }) {
  if (!customer) return null;

  const tabs = [
    ["calls", `Calls (${activity?.calls?.length || 0})`],
    ["visits", `Visits (${activity?.visits?.length || 0})`],
    ["reminders", `Reminders (${activity?.reminders?.length || 0})`],
  ];

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

export default ActivityModal;
