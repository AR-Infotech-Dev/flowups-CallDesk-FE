import { CalendarDays, Eye, EyeOff, KeyRound, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { makeRequest } from "../../api/httpClient";
import { useAuth } from "../../auth/AuthProvider";
import { validatePasswordUpdate } from "../../utils/passwordValidation";

const editableFields = new Set(["email", "whatsappNo", "address", "userName"]);

function getInitials(name = "") {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function getValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().split("T")[0];
}

function normalizeProfile(user = {}) {
  return {
    adminID: user.adminID || "",
    name: getValue(user.name),
    email: getValue(user.email),
    dateOfBirth: toDateInput(user.dateOfBirth),
    userName: getValue(user.userName, user.user_name),
    whatsappNo: getValue(user.whatsappNo, user.whatsapp_no, user.wa_no),
    time_zone: getValue(user.time_zone, "Asia/Kolkata"),
    roleID: getValue(user.roleID, user.role_id),
    roleName: getValue(user.roleName, user.role_name, user.role, user.role_slug),
    company_id: getValue(user.company_id, user.default_company),
    company_name: getValue(user.company_name, user.companyName, user.company),
    is_approver: getValue(user.is_approver, "no"),
    google_location: getValue(user.google_location),
    status: getValue(user.status, "active"),
    address: getValue(user.address),
    contactNo: getValue(user.contactNo, user.contact_no, user.mobile_no),
  };
}

function ProfileField({ label, name, value, type = "text", required = false, icon: Icon, onChange }) {
  const editable = editableFields.has(name);

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

function ReadonlySelect({ label, value }) {
  return (
    <label className="profile-form-field is-readonly">
      <span className="profile-form-label">{label}</span>
      <select value={value || ""} disabled>
        <option value={value || ""}>{value || "-"}</option>
      </select>
    </label>
  );
}

function ReadonlySegment({ label, value, options }) {
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

function PasswordField({ label, value, placeholder, visible, disabled = false, onToggle, onChange }) {
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

function UserProfilePage() {
  const { authSession, login } = useAuth();
  const [profile, setProfile] = useState(() => normalizeProfile(authSession?.user));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const displayName = profile.name || "User";

  const changedPayload = useMemo(
    () => ({
      email: profile.email,
      whatsappNo: profile.whatsappNo,
      address: profile.address,
      userName: profile.userName,
    }),
    [profile]
  );

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const response = await makeRequest("/users/profile", {
        method: "GET",
      });
      setLoading(false);

      if (response?.success) {
        setProfile(normalizeProfile(response.data));
        return;
      }

      toast.error(response?.message || "Unable to load profile.");
    };

    loadProfile();
  }, []);

  const handleChange = (name, value) => {
    if (!editableFields.has(name)) return;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const response = await makeRequest("/users/profile", {
      method: "POST",
      body: changedPayload,
    });
    setSaving(false);

    if (response?.success) {
      const nextUser = {
        ...(authSession?.user || {}),
        ...(response.data || {}),
        email: changedPayload.email,
        whatsappNo: changedPayload.whatsappNo,
        address: changedPayload.address,
        userName: changedPayload.userName,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      login?.({ ...(authSession || {}), user: nextUser });
      setProfile(normalizeProfile(nextUser));
      toast.success(response?.message || "Profile updated successfully.");
      return;
    }

    toast.error(response?.message || "Unable to update profile.");
  };

  const handlePasswordChange = (name, value) => {
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const handleChangePassword = async () => {
    const validationMessage = validatePasswordUpdate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
      requireCurrentPassword: true,
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setChangingPassword(true);
    const response = await makeRequest("/users/profile/change-password", {
      method: "POST",
      body: passwordForm,
    });
    setChangingPassword(false);

    if (response?.success) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(response?.message || "Password changed successfully.");
      return;
    }

    toast.error(response?.message || "Unable to change password.");
  };

  return (
    <section className="user-profile-page">
      <div className="profile-form-hero">
        <div className="profile-form-avatar">{getInitials(displayName)}</div>
        <div className="profile-form-heading">
          <h2>{displayName}</h2>
          <p>{profile.roleName || "User Profile"}</p>
          <div className="profile-form-meta">
            <span>
              <UserRound size={13} />
              {profile.userName || "-"}
            </span>
            <span>
              <Mail size={13} />
              {profile.email || "-"}
            </span>
          </div>
        </div>
        <button type="button" className="profile-save-button" onClick={handleSave} disabled={saving || loading}>
          {saving ? null : <Save size={15} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="profile-form-panel">
        <div className="profile-form-grid">
          <ProfileField label="Name" name="name" value={profile.name} required icon={UserRound} onChange={handleChange} />
          <ProfileField label="Email" name="email" value={profile.email} required type="email" icon={Mail} onChange={handleChange} />
          <ProfileField label="Date of Birth" name="dateOfBirth" value={profile.dateOfBirth} required type="date" icon={CalendarDays} onChange={handleChange} />

          <ProfileField label="User Name" name="userName" value={profile.userName} required onChange={handleChange} />
          <ProfileField label="Whatsapp Number" name="whatsappNo" value={profile.whatsappNo} icon={Phone} onChange={handleChange} />
          <ReadonlySelect label="Time Zone" value={profile.time_zone} />

          <ReadonlySelect label="User Role" value={profile.roleName || profile.roleID} />
          <ReadonlySelect label="Company" value={profile.company_name || profile.company_id} />
          <ReadonlySegment
            label="Approval Privileges"
            value={String(profile.is_approver || "no").toLowerCase()}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />

          <ProfileField label="Google Location" name="google_location" value={profile.google_location} icon={MapPin} onChange={handleChange} />
          <ReadonlySegment
            label="Status"
            value={String(profile.status || "active").toLowerCase()}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        <label className="profile-address-field is-editable">
          <span className="profile-form-label">Address</span>
          <textarea
            name="address"
            value={profile.address || ""}
            rows={7}
            onChange={(event) => handleChange("address", event.target.value)}
            placeholder="Enter address"
          />
        </label>
      </div>

      <div className="profile-form-panel profile-password-panel">
        <div className="profile-password-heading">
          <span>
            <KeyRound size={16} />
          </span>
          <div>
            <h3>Change Password</h3>
            <p>Update your login password from your profile.</p>
          </div>
        </div>

        <div className="profile-password-grid">
          <PasswordField
            label="Current Password"
            value={passwordForm.currentPassword}
            placeholder="Enter current password"
            visible={visiblePasswords.currentPassword}
            disabled={changingPassword}
            onToggle={() => togglePasswordVisibility("currentPassword")}
            onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
          />
          <PasswordField
            label="New Password"
            value={passwordForm.newPassword}
            placeholder="Enter new password"
            visible={visiblePasswords.newPassword}
            disabled={changingPassword}
            onToggle={() => togglePasswordVisibility("newPassword")}
            onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
          />
          <PasswordField
            label="Confirm Password"
            value={passwordForm.confirmPassword}
            placeholder="Re-enter new password"
            visible={visiblePasswords.confirmPassword}
            disabled={changingPassword}
            onToggle={() => togglePasswordVisibility("confirmPassword")}
            onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
          />
        </div>

        <div className="profile-password-actions">
          <button
            type="button"
            className="profile-save-button"
            onClick={handleChangePassword}
            disabled={changingPassword}
          >
            <KeyRound size={15} />
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default UserProfilePage;
