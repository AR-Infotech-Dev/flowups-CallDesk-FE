export function ProductExpiryAlerts({ items = [], onUpdate }) {
  return (
    <div className="space-y-2">
      {items.length ? (
        items.slice(0, 5).map((item) => (
          <div
            key={`${item.customer_id}-${item.serial_number}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {item.customer_name}
              </p>

              <p className="truncate text-xs text-slate-500">
                <span>{item.product_name}</span>
              </p>
            </div>

            <div className="mx-3 text-xs font-medium text-red-600">
              {item.days_left < 0 ? <span className="text-xs font-medium text-red-600">Expired {Math.abs(item.days_left)} days ago</span> : <span className="text-xs font-medium text-amber-600">Expires in {item.days_left} days</span>}
            </div>

            <button
              className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white"
              onClick={() => onUpdate(item)}
            >
              Update
            </button>
          </div>
        ))
      ) : (
        <div className="py-4 text-center text-sm text-slate-500">
          No expiring products 🎉
        </div>
      )}
    </div>
  );
}
