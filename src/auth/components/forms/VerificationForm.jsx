import "@auth/styles/auth.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiMail, FiShield } from "react-icons/fi";
import Spinner from "@components/ui/Spinner";
import { verifyOtp } from "@auth/data/auth.service";
import { validatePasswordUpdate } from "@utils/passwordValidation";

function VerificationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const validationMessage = validatePasswordUpdate({
      newPassword: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setLoading(true);
      const result = await verifyOtp({
        otp: form.code,
        newPassword: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (!result?.success) {
        toast.error(result?.message || "Unable to reset password");
        return;
      }

      toast.success(result?.message || "Password updated successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <AuthInput id="verify-email" label="Email" icon={<FiMail size={12} />} type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" autoComplete="email" disabled={loading} />
      <AuthInput id="verify-code" label="Code" icon={<FiShield size={12} />} type="text" name="code" value={form.code} onChange={handleChange} placeholder="Verification code" autoComplete="one-time-code" disabled={loading} />
      <PasswordInput id="verify-password" label="New Password" name="password" value={form.password} onChange={handleChange} placeholder="New password" disabled={loading} visible={visiblePasswords.password} onToggle={() => togglePasswordVisibility("password")} />
      <PasswordInput id="verify-confirm-password" label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" disabled={loading} visible={visiblePasswords.confirmPassword} onToggle={() => togglePasswordVisibility("confirmPassword")} />

      <button type="submit" className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#113d64] text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5f98] disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
        {loading ? (<> <Spinner /> Resetting... </>) : (<> Verify and Reset <FiArrowRight size={13} /> </>)}
      </button>

      <button type="button" className="flex h-8 w-full items-center justify-center gap-1.5 rounded border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70" onClick={() => navigate("/forgot-password")} disabled={loading}>
        <FiArrowLeft size={12} />
        Back
      </button>
    </form>
  );
}

function AuthInput({ id, label, icon, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[9px] font-semibold uppercase text-slate-600">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          {...inputProps}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      </div>
    </div>
  );
}

function PasswordInput({ id, label, visible, onToggle, disabled, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[9px] font-semibold uppercase text-slate-600">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          disabled={disabled}
          {...inputProps}
        />
        <button
          type="button"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
    </div>
  );
}

export default VerificationForm;
