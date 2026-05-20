function PermissionToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-4 w-8 rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:ring-2 hover:ring-blue-100"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default PermissionToggle;
