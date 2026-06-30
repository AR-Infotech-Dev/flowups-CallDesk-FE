import { getDateInputMinValue } from "../utils/dashboard.utils";

export function ProductExpiryUpdateModal({ alert, loading, saving, expiryDate, error, onExpiryDateChange, onClose, onSave }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Update Product Expiry</h3>
          <p className="mt-1 text-xs text-slate-500">{alert.customer_name} - {alert.product_name || "Product"}</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div><strong>Product:</strong> {alert.product_name || "-"}</div>
            <div><strong>Serial:</strong> {alert.serial_number || "-"}</div>
            <div><strong>Current expiry:</strong> {alert.expiry_date || "-"}</div>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            New Expiry Date
            <input
              type="date"
              min={getDateInputMinValue(alert.expiry_date)}
              value={expiryDate}
              onChange={(event) => onExpiryDateChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              disabled={loading || saving} />
            {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={onSave} disabled={loading || saving || !expiryDate}>
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
