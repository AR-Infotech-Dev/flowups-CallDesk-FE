import React, { useEffect, useState } from "react";
import { CheckCircle2, UserRound, PlusCircle } from "lucide-react";
import { makeRequest } from "../../../api/httpClient";
import { formatRelativeTime } from "../../../utils/common";

// =====================================================
// ITEM
// =====================================================
function TimelineItem({ item, last }) {
    const config = getConfig(item);

    return (
        <div className="relative flex gap-4">
            {!last && <div className="absolute left-3 top-8 bottom-0 w-px bg-slate-200" />}

            <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${config.circle}`}>
                <config.icon size={17} className={config.iconColor} />
            </div>

            <div className="min-w-0 flex-1 pb-4">
                <div className="mb-1 flex items-start justify-between gap-3">
                    <h4 className="text-[13px] font-semibold text-slate-600">
                        {item.changed_by_name || "System"}
                    </h4>

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(item.created_date)}
                    </span>
                </div>

                <div className="rounded-md  border-l-4 border-l-blue-100 bg-white px-4 py-3 text-sm text-slate-600 leading-6 shadow-inner">
                    {getMessage(item)}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// CONFIG
// =====================================================
function getConfig(item) {
    if (item.action_type === "created") {
        return {
            icon: PlusCircle,
            circle: "border-orange-200 bg-orange-50",
            iconColor: "text-orange-500",
        };
    }

    if (item.action_type === "reassigned") {
        return {
            icon: UserRound,
            circle: "border-blue-200 bg-blue-50",
            iconColor: "text-blue-500",
        };
    }

    return {
        icon: CheckCircle2,
        circle: "border-emerald-200 bg-emerald-50",
        iconColor: "text-emerald-500",
    };
}

// =====================================================
// MESSAGE
// =====================================================
function getMessage(item) {
    if (item.action_type === "created") {
        return item.comment || "New ticket created.";
    }

    if (item.action_type === "reassigned") {
        return (
            <>
                Ticket assigned to{" "}
                <span className="font-semibold text-slate-800">
                    {item.new_label}
                </span>
            </>
        );
    }

    if (item.action_type === "updated") {
        return (
            <>
                {labelText(item.field_name)} changed from{" "} <span className="font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: item.old_label || item.old_value }} ></span>{" "} to {" "} <span className="font-semibold text-blue-600" dangerouslySetInnerHTML={{ __html: item.new_label || item.new_value }}></span>
            </>
        );
    }

    return item.comment || "Updated";
}

function labelText(field) {
    const labels = {
        ticket_status: "Status",
        ticket_priority: "Priority",
        due_date: "Due date",
        description: "Description",
    };

    return labels[field] || field;
}

// =====================================================
// MAIN
// =====================================================
function TicketHistory({ ticket_id }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getHistory = async () => {
            if (!ticket_id) return setHistory([]);

            try {
                setLoading(true);

                const res = await makeRequest("tickets/history", {
                    method: "POST",
                    body: { ticket_id },
                });

                setHistory(res?.success ? res.data || [] : []);
            } catch {
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        getHistory();
    }, [ticket_id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-slate-500">
                Loading...
            </div>
        );
    }

    if (!history.length) {
        return (
            <div className="flex h-full items-center justify-center text-slate-500">
                No History Present
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {history.map((item, index) => (
                <TimelineItem
                    key={item.history_id || index}
                    item={item}
                    last={index === history.length - 1}
                />
            ))}
        </div>
    );
}

export default TicketHistory;