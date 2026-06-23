import { Mail, Save, UserRound } from "lucide-react";
import { getInitials } from "../utils/profile.utils";

export function ProfileHero({ profile, loading, saving, onSave }) {
  const displayName = profile.name || "User";

  return (
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
      <button type="button" className="profile-save-button" onClick={onSave} disabled={saving || loading}>
        {saving ? null : <Save size={15} />}
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
