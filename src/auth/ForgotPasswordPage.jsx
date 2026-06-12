import { FiArrowLeft, FiArrowRight, FiMail } from "react-icons/fi";
import Spinner from "../components/ui/Spinner";
import AuthVisualShell from "./AuthVisualShell";

function ForgotPasswordPage({
  formData,
  error,
  helperText,
  onChange,
  onSubmit,
  onBack,
  loading = false,
}) {
  return (
    <AuthVisualShell title="Forgot password" subtitle="Enter your email to receive a verification code." >
      <form onSubmit={onSubmit} className="space-y-2.5">
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-[9px] font-semibold uppercase text-slate-600"> Email </label>
          <div className="relative">
            <input
              id="forgot-email"
              className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="e.g. alex@nexus.com"
              autoComplete="email"
              disabled={loading}
            />
            <FiMail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          </div>
        </div>

        {error ? <div className="rounded bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600">{error}</div> : null}
        {helperText ? <div className="rounded bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700">{helperText}</div> : null}

        <button type="submit" className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#113d64] text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5f98] disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} >
          {loading ? (<> <Spinner /> Sending... </>) : (<> Send Verification <FiArrowRight size={13} /> </>)}
        </button>
        <button type="button" className="flex h-8 w-full items-center justify-center gap-1.5 rounded border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70" onClick={onBack} disabled={loading} >
          <FiArrowLeft size={12} />
          Back to Login
        </button>
      </form>
    </AuthVisualShell>
  );
}

export default ForgotPasswordPage;
