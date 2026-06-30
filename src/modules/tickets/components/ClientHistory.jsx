import React, { useState, useEffect } from "react";
import { X, PhoneCall, PhoneOutgoing, CheckCheck } from "lucide-react";
import { formatDate } from "../../../utils/common";
import { makeRequest } from "../../../api/httpClient";

function normalizeCustomerProducts(source = []) {
    const rows = typeof source === "string" ? safeParseJson(source, []) : source;
    return Array.isArray(rows)
        ? rows
            .map((row) => ({
                product_id: row?.product_id || "",
                product_name: row?.product_name || "",
                serial_number: row?.serial_number || row?.product_serial_number || "",
            }))
            .filter((row) => row.product_id || row.product_name || row.serial_number)
        : [];
}

function CustomerProductsPanel({ customer = {} }) {
    const products = normalizeCustomerProducts(customer?.customer_products || customer?.products || []);

    return (
        <div className="border-b border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Products</h4>
                <span className="text-[11px] text-slate-400">{products.length} item{products.length === 1 ? "" : "s"}</span>
            </div>
            {products.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                    No products assigned
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map((product, index) => (
                        <div key={`${product.product_id || index}-${product.serial_number || index}`} className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 w-auto">
                            <div className="truncate text-[9px] font-semibold text-slate-700">{product.product_name || "Unnamed Product"}</div>
                            <div className="mt-0 text-[10px] text-slate-500">Serial No: {product.serial_number || "-"}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function parseDateOnly(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    return date;
}

function isAmcActive(client = {}) {
    if (String(client?.is_amc || "").toLowerCase() !== "yes") return false;

    const endDate = parseDateOnly(client?.amc_end_date);
    if (!endDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return endDate >= today;
}

function ClientHistory({ openedTiket = null, client = {}, CLIENT_HISTORY_ITEMS }) {
    const [ticketList, setTicketList] = useState([]);
    const hasClient = Object.keys(client).length > 0;
    const { customer_id, name, created_date, mobile_no, email, contact_person } = client;
    const displayName = name || (customer_id ? `Client #${customer_id}` : "Client");
    const showAmcFlag = isAmcActive(client);

    const getClientsTicket = async () => {
        try {
            const res = await makeRequest("tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: customer_id,
                    getAll: "Y",
                }),
            });

            if (res?.success) {
                setTicketList(res.data || []);
            } else {
                setTicketList([]);
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
            setTicketList([]);
        }
    };

    useEffect(() => {
        if (!customer_id) return;
        getClientsTicket();
    }, [customer_id]);

    if (!hasClient) {
        return (
            <div className="h-full flex justify-center items-center text-slate-500">
                No Client Selected
            </div>
        );
    }

    return (
        <div className="client-history-panel">

            <div className={`border ${showAmcFlag ? '  bg-green-50 border-green-200' : 'bg-white border-slate-200'} px-4 py-2 w-full max-w-md shadow-xs`}>
                {/* Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100 relative">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <PhoneCall size={16} className="text-white" />
                    </div>

                    <div className="">
                        <h3 className="text-sm font-semibold text-slate-800">
                            {displayName}
                        </h3>
                        {showAmcFlag && (
                            <span className="absolute right-0 top-0 bg-green-600 uppercase text-white border rounded-2xl font-semibold text-[7px] p-1 px-2" >
                                amc active
                            </span>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                            Enterprise Client • San Francisco, CA
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Member Since
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                            {/* Jan 12, 2021 */}
                            {formatDate(created_date, "short")}
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Total Tickets
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                            {ticketList.length || 0}
                        </p>
                    </div>
                </div>

                {(mobile_no || email || contact_person) && (
                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                        {contact_person && <p><span className="font-semibold text-slate-700">Contact:</span> {contact_person}</p>}
                        {mobile_no && <p><span className="font-semibold text-slate-700">Mobile:</span> {mobile_no}</p>}
                        {email && <p><span className="font-semibold text-slate-700">Email:</span> {email}</p>}
                    </div>
                )}
            </div>
            <CustomerProductsPanel customer={client} />

            <div className="histories ticket-scroll-pane px-2 space-y-2 mt-2">
                {ticketList.filter((item) => item.ticket_id !== openedTiket).map((item) => (
                    <article key={item.ticket_id} className="relative rounded-sm border border-slate-200 bg-white  px-4 py-2 shadow-sm" >
                        <span className={`absolute top-2 right-2 rounded-full text-[${item.status_color}] bg-[${item.status_color}] px-2.5 py-0.5 text-[0.55rem] shadow-sm font-medium`} style={{ backgroundColor: item.status_color , color: "white" }}>
                            {item?.ticket_status}
                        </span>
                        <div className="flex items-center  justify-center gap-3">
                            <h4 className=" font-semibold text-slate-800 w-full">
                                {item.ticket_no && <span className="mr-2.5 text-orange-400 text-[12px]">{item.ticket_no} <br /></span>}
                                <span className="flex justify-between">
                                    <span className="text-red-300 text-[11px] w-[70%]"> Query Type : {item.query_type}</span>
                                    <span className="text-slate-600 text-[11px] w-[30%] text-right">{formatDate(item.created_date, "short")}</span><br />
                                </span>
                                <span className="text-[13px] font-semibold text-slate-500" dangerouslySetInnerHTML={{ __html: item.description }} ></span>
                            </h4>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item?.title}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}
export default ClientHistory;
