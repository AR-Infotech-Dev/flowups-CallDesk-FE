export function AmcAlerts({ items = [], onRenew }) {
  return (
    <div className="space-y-2">
      {(items.length
        ? items.slice(0, 5)
        : [
          {
            customer: "No AMC Alerts",
            daysLeft: 0,
            tone: "green",
          },
        ]
      ).map((item) => (
        <div
          key={item.customer}
          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {item.customer}
            </p>

            <p className={`text-xs font-medium ${item.daysLeft < 0 ? "text-red-500" : "text-amber-500"} `}>
              {item.daysLeft < 0
                ? `Expired ${Math.abs(item.daysLeft)} days ago`
                : `Expires in ${item.daysLeft} days`}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-amber-900">
              RP : {item.responsible_person}
            </p>
          </div>

          {item.customer !== "No AMC Alerts" && (
            <>
              <button
                className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                onClick={() => onRenew?.(item)}
              >
                Renew
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
