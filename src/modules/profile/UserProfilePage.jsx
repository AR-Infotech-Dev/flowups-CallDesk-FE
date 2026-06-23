import { useAuth } from "@auth/components/AuthProvider";
import { ProfileDetailsPanel } from "./components/ProfileDetailsPanel";
import { ProfileHero } from "./components/ProfileHero";
import { ProfilePasswordPanel } from "./components/ProfilePasswordPanel";
import { useUserProfile } from "./hooks/useUserProfile";

function UserProfilePage() {
  const { authSession, login } = useAuth();
  const {
    profile,
    passwordForm,
    loading,
    saving,
    changingPassword,
    visiblePasswords,
    handleChange,
    handleSave,
    handlePasswordChange,
    togglePasswordVisibility,
    handleChangePassword,
  } = useUserProfile({ authSession, login });

  return (
    <section className="user-profile-page">
      <ProfileHero
        profile={profile}
        loading={loading}
        saving={saving}
        onSave={handleSave}
      />

      <ProfileDetailsPanel
        profile={profile}
        onChange={handleChange}
      />

      <ProfilePasswordPanel
        passwordForm={passwordForm}
        visiblePasswords={visiblePasswords}
        changingPassword={changingPassword}
        onPasswordChange={handlePasswordChange}
        onTogglePasswordVisibility={togglePasswordVisibility}
        onChangePassword={handleChangePassword}
      />
    </section>
  );
}

export default UserProfilePage;
