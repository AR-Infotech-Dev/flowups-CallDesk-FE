import { CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { ProfileField, ReadonlySegment, ReadonlySelect } from "./ProfileFields";

export function ProfileDetailsPanel({ profile, onChange }) {
  return (
    <div className="profile-form-panel">
      <div className="profile-form-grid">
        <ProfileField label="Name" name="name" value={profile.name} required icon={UserRound} onChange={onChange} />
        <ProfileField label="Email" name="email" value={profile.email} required type="email" icon={Mail} onChange={onChange} />
        <ProfileField label="Date of Birth" name="dateOfBirth" value={profile.dateOfBirth} required type="date" icon={CalendarDays} onChange={onChange} />

        <ProfileField label="User Name" name="userName" value={profile.userName} required onChange={onChange} />
        <ProfileField label="Whatsapp Number" name="whatsappNo" value={profile.whatsappNo} icon={Phone} onChange={onChange} />
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

        <ProfileField label="Google Location" name="google_location" value={profile.google_location} icon={MapPin} onChange={onChange} />
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
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Enter address"
        />
      </label>
    </div>
  );
}
