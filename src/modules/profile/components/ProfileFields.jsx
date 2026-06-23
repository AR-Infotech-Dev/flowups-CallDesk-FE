import { Eye, EyeOff } from "lucide-react";
import { editableProfileFields } from "../utils/profile.utils";

export function ProfileField({ label, name, value, type = "text", required = false, icon: Icon, onChange }) {
  const editable = editableProfileFields.has(name);

  return (
    <label className={`profile-form-field ${editable ? "is-editable" : "is-readonly"}`}>
      <span className="profile-form-label">
        {Icon ? <Icon size={13} /> : null}
        {label}
        {required ? <b>*</b> : null}
      </span>
      <input
        type={type}
        name={name}
        value={value || ""}
        readOnly={!editable}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

export function ReadonlySelect({ label, value }) {
  return (
    <label className="profile-form-field is-readonly">
      <span className="profile-form-label">{label}</span>
      <select value={value || ""} disabled>
        <option value={value || ""}>{value || "-"}</option>
      </select>
    </label>
  );
}

export function ReadonlySegment({ label, value, options }) {
  return (
    <div className="profile-form-field is-readonly">
      <span className="profile-form-label">{label}</span>
      <div className="profile-segment">
        {options.map((option) => (
          <span key={option.value} className={String(value).toLowerCase() === option.value ? "active" : ""}>
            {option.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PasswordField({ label, value, placeholder, visible, disabled = false, onToggle, onChange }) {
  return (
    <label className="profile-form-field is-editable profile-password-field">
      <span className="profile-form-label">{label} <b>*</b></span>
      <span className="profile-password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="profile-password-eye-button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
    </label>
  );
}
