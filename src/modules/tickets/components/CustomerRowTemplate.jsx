import React from 'react'
import { FileDigit } from 'lucide-react';
const CustomerRowTemplate = ({ item, isSelected, onClick, style }) => {
    const customer = item.original || {};
    const products = Array.isArray(customer.customer_products)
        ? customer.customer_products
        : [];

    const serialNumbers = products
        .map((product) => product.serial_number)
        .filter(Boolean)
        .join(", ");

    return (
        <div style={style} onClick={onClick} className={`cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-start justify-between text-sm ${isSelected ? "bg-blue-50" : ""}`}>
            <div className="relative flex w-full items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-medium text-gray-900">
                        {customer.name || "Unnamed Client"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {customer.mobile_no && (
                            <span>{customer.mobile_no}</span>
                        )}
                        {customer.email && (
                            <span className="break-all truncate">{customer.email}</span>
                        )}
                    </div>

                    {serialNumbers && (
                        <div className="mt-1 text-xs text-blue-600 flex gap-2 items-center">
                            <FileDigit size={12} /> {serialNumbers}
                        </div>
                    )}
                </div>

                {isSelected && (
                    <span className="absolute right-0 top-0 shrink-0 text-xs font-medium text-green-600">
                        Selected
                    </span>
                )}
            </div>
        </div>
    );
};

export default CustomerRowTemplate
