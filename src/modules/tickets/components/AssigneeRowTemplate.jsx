import React from 'react'
import { getAvatarColor, getInitials } from '@/utils/common';
function StatusIndicator({ status }) {
    return (
        <div className={`inline-flex items-center justify-center w-2 h-2 rounded-full border ${status === "active" ? "border-green-400" : "border-red-400"}`} >
            <div
                className="w-2 h-2 rounded-full"
                style={{
                    backgroundColor: status === "active" ? "#22c55e" : "#ef4444",
                    boxShadow:
                        status === "active"
                            ? "0 0 6px #22c55e, 0 0 12px #22c55e"
                            : "0 0 6px #ef4444, 0 0 12px #ef4444",
                }}
            />
        </div>
    );
}
const AssigneeRowTemplate = ({ item, isSelected, onClick, style }) => {
    const assignee = item.original || {};
    const initials = getInitials(assignee.name);
    const color = getAvatarColor(assignee.adminID || assignee.name);
    return (
        <div style={style} onClick={onClick} className={`cursor-pointer px-4 py-3 hover:bg-gray-100 flex items-start justify-between text-sm ${isSelected ? "bg-blue-50 border border-blue-100" : ""}`}>
            <div className="relative flex w-full items-start justify-between gap-3">
                <div className="min-w-0 w-full">
                    <div className="flex gap-2 items-center justify-between font-medium text-gray-900">
                        <div className='flex gap-3 items-center'>
                            {/* <StatusIndicator status={assignee.status} /> */}
                            <span
                                className='flex items-center justify-center h-6 w-6 text-xs border rounded-full'
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${color} 15%, white)`,
                                    borderColor: `color-mix(in srgb, ${color} 30%, white)`,
                                    color,
                                }}
                            >
                                {initials}
                            </span>
                            <span>
                                {assignee.name || "Unnamed Client"}
                            </span>

                        </div>
                        <div className='flex gap-2'>
                            <span className={`w-auto text-xs rounded-sm px-3 py-0.5 font-light
                            ${assignee.status == "inactive" && ' text-red-500'}
                            ${assignee.status == "active" && ' text-green-500 '}
                            `}>
                                {assignee.status == "active" ? 'Available' : 'Not Available'}
                            </span>
                            <span className={`w-auto text-xs rounded-sm px-3 py-0.5 py border font-light
                            ${assignee.pending_tickets_count >= 5 && 'border-red-400 text-red-500 bg-red-50'}
                            ${assignee.pending_tickets_count <= 5 && 'border-amber-400 text-amber-500 bg-amber-50'}
                            ${assignee.pending_tickets_count == 0 && 'border-green-400 text-green-500 bg-green-50'}
                            `}>
                                {assignee.pending_tickets_count} Pending
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AssigneeRowTemplate
