import { accessPermissionColumns } from "../data/accessControlData";
import PermissionToggle from "./PermissionToggle";

function PermissionsEmptyState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-32 w-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
          <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
            <span className="text-4xl font-bold">ID</span>
          </div>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-900">Select User or Role</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select a user or role from the sidebar to begin managing their specific permissions across the platform modules.
        </p>
      </div>
    </div>
  );
}

function PermissionsMatrix({
  modules,
  loadingMenus,
  selectedIdentity,
  loadingPermissions,
  onEnableAll,
  onConfigure,
  onPermissionChange,
}) {
  return (
    <section className="min-w-0 overflow-hidden border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Module Permissions</h3>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          {loadingMenus && <span>Loading menus...</span>}
          {loadingPermissions && <span>Loading permissions...</span>}
          {selectedIdentity && (
            <>
              <span>Bulk Actions:</span>
              <button type="button" className="font-semibold text-blue-600 hover:text-blue-700" onClick={onEnableAll}>
                Enable All
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedIdentity ? (
        <PermissionsEmptyState />
      ) : loadingPermissions ? (
        <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
          Loading permissions...
        </div>
      ) : (
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[minmax(180px,1fr)_80px_80px_80px_80px_110px] border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <div>Module</div>
            {accessPermissionColumns.map((column) => (
              <div key={column.key} className="text-center">
                {column.label}
              </div>
            ))}
            <div className="text-center">Advanced</div>
          </div>

          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.id}
                className="grid min-h-11 grid-cols-[minmax(180px,1fr)_80px_80px_80px_80px_110px] items-center border-b border-slate-100 px-4 text-xs text-slate-700 last:border-b-0 hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2 font-medium text-slate-800">
                  <Icon size={15} className="shrink-0 text-slate-400" />
                  <span className="truncate">{module.name}</span>
                </div>

                {accessPermissionColumns.map((column) => {
                  const supported = Boolean(module.supports[column.key]);
                  const disabled = !supported || (column.key !== "view" && !module.permissions.view);

                  return (
                    <div key={column.key} className="text-center">
                      {supported ? (
                        <PermissionToggle
                          checked={Boolean(module.permissions[column.key])}
                          disabled={disabled}
                          onChange={(nextValue) => onPermissionChange(module.id, column.key, nextValue)}
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </div>
                  );
                })}

                <div className="text-center">
                  <button
                    type="button"
                    disabled={!module.permissions.view}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
                    onClick={() => onConfigure(module.id)}
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </section>
  );
}

export default PermissionsMatrix;
