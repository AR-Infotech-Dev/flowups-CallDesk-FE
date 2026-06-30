import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { validatePasswordUpdate } from "@utils/passwordValidation";
import { changeProfilePassword, getProfile, updateProfile } from "../data/profile.service";
import {
  buildChangedProfilePayload,
  buildUpdatedSessionUser,
  editableProfileFields,
  normalizeProfile,
} from "../utils/profile.utils";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialVisiblePasswords = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

export const useUserProfile = ({ authSession, login }) => {
  const [profile, setProfile] = useState(() => normalizeProfile(authSession?.user));
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState(initialVisiblePasswords);

  const changedPayload = useMemo(() => buildChangedProfilePayload(profile), [profile]);

  const loadProfile = async () => {
    setLoading(true);
    const response = await getProfile();
    setLoading(false);

    if (response?.success) {
      setProfile(normalizeProfile(response.data));
      return;
    }

    toast.error(response?.message || "Unable to load profile.");
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (name, value) => {
    if (!editableProfileFields.has(name)) return;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const response = await updateProfile(changedPayload);
    setSaving(false);

    if (response?.success) {
      const nextUser = buildUpdatedSessionUser({
        currentUser: authSession?.user || {},
        responseData: response.data || {},
        changedPayload,
      });

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
    const response = await changeProfilePassword(passwordForm);
    setChangingPassword(false);

    if (response?.success) {
      setPasswordForm(emptyPasswordForm);
      toast.success(response?.message || "Password changed successfully.");
      return;
    }

    toast.error(response?.message || "Unable to change password.");
  };

  return {
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
  };
};
