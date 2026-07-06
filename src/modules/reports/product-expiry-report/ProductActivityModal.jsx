import { X } from "lucide-react";
import { formatReportDateTime } from "../report.utils";

function ActivityList({ rows = [], emptyText, render }) {
    if (!rows.length) {
        return <div className="amc-activity-empty">{emptyText}</div>;
    }

    return <div className="amc-activity-list">{rows.map(render)}</div>;
}

export function ProductActivityModal({ customer, product, activity, activeTab, onTabChange, onClose }) {
    console.log({ customer, product, activity, activeTab, onTabChange, onClose });
    
    if (!customer) return null;
    
    const tabs = [
        ["calls", `Calls (${activity?.calls?.length || 0})`],
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
                        <h3 id="amc-activity-modal-title">Product Activity</h3>
                        <p>{customer.name || customer.customer_name || "Selected customer"}{product?.product_name ? ` | ${product.product_name}` : ""}</p>
                    </div>
                    <button type="button" className="amc-modal-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="amc-activity-tabs">
                    {tabs.map(([key, label]) => (
                        <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => onTabChange(key)}> {label} </button>
                    ))}
                </div>

                <div className="amc-modal-body">
                    {activeTab === "calls" ? (
                        <ActivityList
                            rows={activity?.calls || []}
                            emptyText="No product calls yet"
                            render={(row, index) => (
                                <div key={row.ticket_id || index} className="amc-activity-item">
                                    <strong>{row.ticket_no || `Ticket #${row.ticket_id}`}</strong>
                                    <span>{formatReportDateTime(row.created_date)} | {row.ticket_status || "-"}</span>
                                    <p>{row.description || "-"}</p>
                                </div>
                            )}
                        />
                    ) : null}

                    {activeTab === "reminders" ? (
                        <ActivityList
                            rows={activity?.reminders || []}
                            emptyText="No reminders yet"
                            render={(row, index) => (
                                <div key={row.reminder_id || index} className="amc-activity-item">
                                    <strong>{row.email_subject || "Product Reminder"} | {row.status || "-"}</strong>
                                    <span>{formatReportDateTime(row.sent_at)} | Report: {row.include_report || "no"}</span>
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

export default ProductActivityModal;
