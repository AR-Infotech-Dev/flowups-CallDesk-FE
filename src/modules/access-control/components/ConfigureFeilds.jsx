import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import { ShieldCheck, X } from "lucide-react";
import ActionButton from "../../../components/ui/ActionButton";

function ConfigureFeilds({
  isOpen,
  onClose,
  title = "Advanced Settings",
  subtitle = "",
  loadingAdvancedFields,
  advancedModule,
  onFieldPermissionChange,
  onFieldBulkChange,
}) {
  const fields = advancedModule?.fields || [];
  const hasFields = fields.length > 0;
  const allVisible = hasFields && fields.every((field) => Boolean(field.visible));
  const allEditable = hasFields && fields.every((field) => Boolean(field.editable));

  return (
    <FlyoutPanel
      isOpen={Boolean(isOpen)}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      panelClassName="!w-[400px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton variant="flyoutSecondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="flyoutPrimary"
            onClick={onClose}
          >
            Apply Changes
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-1">
            <div className="flex h-8 items-center gap-3 rounded-xs bg-blue-50 px-3 text-sm font-semibold text-blue-700">
              <ShieldCheck size={18} />
              <span>Field Permissions</span>
            </div>

            <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
              <div className="grid grid-cols-[minmax(150px,1fr)_80px_80px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <div>{advancedModule?.name || ''}</div>
                <label className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    disabled={!hasFields}
                    onChange={(event) => onFieldBulkChange?.("visible", event.target.checked)}
                  />
                  <span>Visible</span>
                </label>
                <label className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={allEditable}
                    disabled={!hasFields}
                    onChange={(event) => onFieldBulkChange?.("editable", event.target.checked)}
                  />
                  <span>Editable</span>
                </label>
              </div>

              {loadingAdvancedFields ? (
                <div className="px-3 py-5 text-center text-xs text-slate-500">Loading fields...</div>
              ) : fields.length ? (
                fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid min-h-10 grid-cols-[minmax(150px,1fr)_80px_80px] items-center gap-3 border-b border-slate-100 px-3 text-xs last:border-b-0"
                  >
                    <span className="truncate font-medium text-slate-700" title={field.field_name || field.label}>
                      {field.field_name || field.label}
                    </span>
                    <div className="text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(field.visible)}
                        onChange={(event) => onFieldPermissionChange?.(field.key, "visible", event.target.checked)}
                      />
                    </div>
                    <div className="text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(field.editable)}
                        disabled={!field.visible}
                        onChange={(event) => onFieldPermissionChange?.(field.key, "editable", event.target.checked)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-5 text-center text-xs text-slate-500">No fields found for this module.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FlyoutPanel>
  )
}

export default ConfigureFeilds
