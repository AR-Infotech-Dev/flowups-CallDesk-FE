import '@auth/styles/auth.css';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUserAuthId, saveAuthSession, saveMenuList, savePermissions } from "@auth/utils/authStorage";
import { fetchMenuList, fetchUserPermissions } from "@auth/utils/permissions";
import { useAuth } from "../AuthProvider";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiArrowRight, FiUser } from "react-icons/fi";
import Spinner from '@components/ui/Spinner';
import { encryptLoginPassword } from "@auth/utils/loginEncryption";
import { getlogin } from "@auth/data/auth.service";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedData = {
      ...form,
      [name]: value,
    };
    setForm(updatedData);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const encryptedPassword = await encryptLoginPassword(form.password);
      const res = await getlogin({ username: form.username, encryptedPassword })

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      const session = {
        user: res?.user,
        authid: getUserAuthId(res?.user),
      };

      saveAuthSession(session);
      const permissions = await fetchUserPermissions(session.authid, session.user?.company_id || session.user?.default_company || "");
      const menus = await fetchMenuList("ithech Login madhe", {
        fallbackPermissions: permissions,
        forceRefresh: true,
      });
      savePermissions(permissions);
      saveMenuList(menus);
      login(session);
      toast.success("Login success");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-2.5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="login-username" className="auth-login-label text-[9px] font-semibold uppercase text-slate-600"> Username </label>
        </div>
        <div className="relative">
          <input
            id="login-username"
            className="auth-login-input h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="text"
            name="username"
            placeholder="e.g. alex.nexus"
            value={form.username}
            // autoComplete="username"
            onChange={handleChange}
          />
          <FiUser className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="login-password" className="auth-login-label text-[9px] font-semibold uppercase text-slate-600"> Password </label>
          <Link to="/forgot-password" className="auth-login-link text-[10px] font-medium text-blue-600 hover:underline"> Forgot password? </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            className="auth-login-input h-8 w-full rounded border border-slate-200 bg-white px-2.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            // autoComplete="current-password"
            onChange={handleChange}
          />
          <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => {
            setShowPassword(!showPassword);
          }}>{!showPassword ? <FaEye size={12} /> : <FaEyeSlash size={12} />}  </button>
        </div>
      </div>
      <button type="submit" className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#2563eb] text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5f98] disabled:cursor-not-allowed disabled:opacity-70">
        {loading ? <Spinner /> : <>Sign In <FiArrowRight size={13} /></>}
      </button>
      <p className="auth-login-help text-center text-[10px] text-slate-500">
        Don&apos;t have an account? <span className="auth-login-link font-medium text-blue-600">Contact administrator</span>
      </p>
    </form>
  );
}

export default LoginForm;
