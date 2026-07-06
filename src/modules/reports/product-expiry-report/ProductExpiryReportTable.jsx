import { toast } from "react-toastify";
import { sendAlertToCustomer } from "./product.report.service"
import { Phone, Send, MailCheck, History } from "lucide-react"

const statusLabels = {
  expired: "Expired",
  expiring_soon: "Expiring Soon",
  valid: "Valid",
};

const headers = [
  ["expiry_date", "Expiry Date"],
  ["days_left", "Days Left"],
  ["expiry_status", "Status"],
  ["customer_name", "Customer"],
  ["product_name", "Product"],
  ["serial_number", "Serial No."],
  ["company_name", "Company"],
  ["mobile_no", "Contact"],
  ["action", "Action"],
];

function ProductExpiryReportTable({
  rows,
  loading,
  sortConfig,
  onSort,
  refreshList,
  onMakeCall,
  onOpenActivity,
  activityLoadingRowKey,
  callingRowKey,
}) {
  if (loading) {
    return <div className="product-expiry-empty">Loading product expiry report...</div>;
  }
  const getDetails = (row) => {
    return {
      product: {
        "product_id": row.product_id || null,
        "product_name": row.product_name || null,
        "serial_number": row.serial_number || null,
        "expiry_date": row.expiry_date || null,
        "days_left": row.days_left || null,
        "expiry_status": row.expiry_status || null,
        "add_ons": row.add_ons || null
      },
      customer_id: row.customer_id || null
    }
  }
  const handelAlertSend = async (row) => {
    try {
      const { product, customer_id } = getDetails(row);

      if (!customer_id) {
        toast.error("Customer not found !");
      }
      const res = await sendAlertToCustomer({ customer_id, product });
      if (res.success) {
        refreshList();
        toast.success(res?.message || `Alert sent successfully`);
        return;
      }
      toast.error(res?.msg || res?.message || "Something went wrong");
    } catch (error) {
      toast.error(error.message || "Server error");
    }
  }
  return (
    <div className="product-expiry-table-panel">
      <div className="product-expiry-table-scroll">
        <table className="product-expiry-table">
          <thead>
            <tr className="w-full">
              {headers.map(([key, label]) => (
                <th key={key}>
                  <button type="button" onClick={() => onSort(key)}>
                    {label}
                    {sortConfig.key === key ? <span>{sortConfig.direction === "ASC" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={headers.length} className="product-expiry-empty-cell">No product expiry records found</td>
              </tr>
            ) : rows.map((row) => (
              <ProductExpiryReportRow
                key={`${row.customer_id}-${row.product_id}-${row.serial_number}-${row.expiry_date}`}
                row={row}
                onMakeCall={onMakeCall}
                handelAlertSend={handelAlertSend}
                onOpenActivity={onOpenActivity}
                activityLoadingRowKey={activityLoadingRowKey}
                callingRowKey={callingRowKey}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductExpiryReportRow({
  row,
  handelAlertSend,
  onMakeCall,
  onOpenActivity,
  activityLoadingRowKey,
  callingRowKey,
}) {
  const sentToday = Boolean(Number(row?.sent_today || 0));
  const rowKey = `${row.customer_id}-${row.serial_number || row.product_id || ""}`;
  const isActivityLoading = activityLoadingRowKey === rowKey;
  const isCalling = callingRowKey === rowKey;

  return (
    <tr>
      <td><strong>{row.expiry_date || "-"}</strong></td>
      <td>{formatDaysLeft(row.days_left)}</td>
      <td><span className={`product-expiry-status ${row.expiry_status || "valid"}`}>{statusLabels[row.expiry_status] || row.expiry_status || "-"}</span></td>
      <td><strong>{row.customer_name || "-"}</strong><br /><span>{row.contact_person || row.email || "-"}</span></td>
      <td>{row.product_name || "-"}</td>
      <td>{row.serial_number || "-"}</td>
      <td>{row.company_name || "-"}</td>
      <td>{row.mobile_no || "-"}</td>
      <td className="items-center w-fit">
        {row.expiry_status !== "valid" &&
          <div className="flex items-center h-full gap-2" >
            <button
              title="Make Call"
              type="button"
              className="product-expiry-button primary"
              onClick={() => onMakeCall(row)}
              disabled={isCalling}
            >
              <Phone size={14} />
            </button>
            <button title="History" type="button" className="product-expiry-button primary" onClick={() => onOpenActivity(row)} disabled={isActivityLoading}>
              <History size={14} />
            </button>
            {!sentToday ?
              <button title="Send Reminder" type="button" className="product-expiry-button primary" onClick={() => handelAlertSend(row)}><Send size={14} /></button>
              :
              <button title="Reminder sent today" type="button" className=" primary"><MailCheck size={26} color="green" /> </button>
            }
          </div>
        }
      </td>
    </tr>
  );
}

function formatDaysLeft(value) {
  const days = Number(value);
  if (Number.isNaN(days)) return "-";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Expires today";
  return `${days} days`;
}

export default ProductExpiryReportTable;
