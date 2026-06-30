// TableSkeleton.jsx
import React from "react";

const columnWidths = ["w-32", "w-40", "w-28", "w-24", "w-20"];

function TableSkeleton({
    resolvedColumns = [],
    rows = 10,
    showHeader = false,
    className = "",
    columns = 10,
}) {
    return (
        <>
            {
                showHeader && (
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            {resolvedColumns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${column.className || ""} ${column.resizable === false ? "" : "is-resizable"} h-4 rounded bg-gray-200 animate-pulse`}
                                    style={{ width: column.currentWidth, minWidth: column.currentWidth, maxWidth: column.currentWidth }}
                                >
                                    <div
                                        aria-hidden="true"
                                        className={`h-4 rounded bg-gray-200 animate-pulse`}
                                    />
                                </th>))
                            }
                            <th>
                                <div
                                    aria-hidden="true"
                                    className={`h-4 rounded bg-gray-200 animate-pulse`}
                                />
                            </th>
                            <th>
                                <div
                                    aria-hidden="true"
                                    className={`h-4 rounded bg-gray-200 animate-pulse`}
                                />
                            </th>
                        </tr>
                    </thead>
                )
            }
            {
                Array.from({ length: rows }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100 last:border-b-0">
                        {resolvedColumns.map((column) => (
                            <td
                                key={column.key}
                                className={`${column.className || ""} ${column.resizable === false ? "" : "is-resizable"} h-4 rounded bg-gray-200 animate-pulse`}
                                style={{ width: column.currentWidth, minWidth: column.currentWidth, maxWidth: column.currentWidth }}
                            >
                                <div
                                    aria-hidden="true"
                                    className={`h-4 rounded bg-gray-200 animate-pulse`}
                                />
                            </td>))
                        }
                    </tr>
                ))}
        </>
    );
}

export default TableSkeleton;