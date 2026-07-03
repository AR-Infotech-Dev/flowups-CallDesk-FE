import "@auth/styles/auth.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiMail } from "react-icons/fi";
import Spinner from "@components/ui/Spinner";
import { getOtp } from "@auth/data/auth.service";

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      const result = await getOtp({ email: form.email });

      if (!result?.success) {
        toast.error(result?.message || "Unable to send verification code");
        return;
      }

      toast.success(result?.message || "Verification code sent successfully");
      navigate("/verify-reset", { state: { email: form.email } });
    } catch (error) {
      toast.error(error?.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div>
        <label htmlFor="forgot-email" className="mb-1 block text-[9px] font-semibold uppercase text-slate-600">
          Email
        </label>
        <div className="relative">
          <input
            id="forgot-email"
            className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="e.g. alex@nexus.com"
            autoComplete="email"
            disabled={loading}
          />
          <FiMail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
        </div>
      </div>

      <button type="submit" className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#2563eb] text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5f98] disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
        {loading ? (<> <Spinner /> Sending... </>) : (<> Send Verification <FiArrowRight size={13} /> </>)}
      </button>

      <button type="button" className="flex h-8 w-full items-center justify-center gap-1.5 rounded border border-slate-200 bg-white text-sm shadow-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70" onClick={() => navigate("/login")} disabled={loading}>
        <FiArrowLeft size={12} />
        Back to Login
      </button>
    </form>
  );
}

export default ForgotPasswordForm;
