import {
  Accessibility,
  BriefcaseBusiness,
  Building2,
  ContactRound,
  FileText,
  Folder,
  Gauge,
  LayoutGrid,
  Mail,
  Map,
  MenuSquare,
  NotepadText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
} from "lucide-react";
import DefaultLabel from "./DefaultLabel";
import ValidationError from "./ValidationError";

const ICONS = {
  Accessibility,
  BriefcaseBusiness,
  Building2,
  ContactRound,
  FileText,
  Folder,
  Gauge,
  LayoutGrid,
  Mail,
  Map,
  MenuSquare,
  NotepadText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
};

const DEFAULT_ICON_OPTIONS = Object.keys(ICONS);

function IconPicker({ field, value, onChange, error }) {
  const options = field.options?.length ? field.options : DEFAULT_ICON_OPTIONS;
  const isDisabled = Boolean(field.disabled || field.readOnly);

  const handleSelect = (iconName) => {
    if (isDisabled) return;

    onChange?.({
      target: {
        name: field.name,
        value: iconName,
      },
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-1 p-1">
      <DefaultLabel label={field.label} required={field.required} />

      <div className="grid grid-cols-10 gap-2 p-2  border border-slate-200 rounded-xs">
        {options.map((iconName) => {
          const Icon = ICONS[iconName] || Folder;
          const isActive = value === iconName;

          return (
            <button
              key={iconName}
              type="button"
              title={iconName}
              aria-label={`Select ${iconName}`}
              disabled={isDisabled}
              onClick={() => handleSelect(iconName)}
              className={`flex h-10 w-10 items-center justify-center rounded-md border text-slate-600 transition-all m-auto disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      {error ? <ValidationError error={error} /> : null}
    </div>
  );
}

export default IconPicker;
