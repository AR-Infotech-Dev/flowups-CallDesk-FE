import { toast } from "react-toastify";
import { sendAlertToCustomer } from "../data/product.report.service"

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

function ProductExpiryReportTable({ rows, loading, sortConfig, onSort }) {
  if (loading) {
    return <div className="product-expiry-empty">Loading product expiry report...</div>;
  }
  const handelAlertSend = async (row) => {
    try {
      const product = {
        "product_id": row.product_id || null,
        "product_name": row.product_name || null,
        "serial_number": row.serial_number || null,
        "expiry_date": row.expiry_date || null,
        "days_left": row.days_left || null,
        "expiry_status": row.expiry_status || null,
        "add_ons": row.add_ons || null
      };
      const customer_id = row.customer_id || null
      if (!customer_id) {
        toast.error("Customer not found !");
      }
      const res = await sendAlertToCustomer({ customer_id, product });
      if (res.success) {
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
              <ProductExpiryReportRow key={`${row.customer_id}-${row.product_id}-${row.serial_number}-${row.expiry_date}`} row={row} handelAlertSend={handelAlertSend} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductExpiryReportRow({ row, handelAlertSend }) {
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
      <td>
        {row.expiry_status !== "valid" &&
          <button type="button" className="product-expiry-button primary" onClick={() => handelAlertSend(row)}>Send Alert</button>
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
