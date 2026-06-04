import '../auth/styles/auth.css';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { makeRequest } from "../api/httpClient";
import { getUserAuthId, saveAuthSession, saveMenuList, savePermissions } from "./authStorage";
import { fetchMenuList, fetchUserPermissions } from "./permissions";
import { useAuth } from "./AuthProvider";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Spinner from '../components/ui/Spinner';
import { encryptLoginPassword } from "./loginEncryption";

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
      
      const res = await makeRequest("login", {
        method: "POST",
        body: {
          username: form.username,
          encryptedPassword,
        }
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      const session = {
        // token: res?.token,
        user: res?.user,
        authid: getUserAuthId(res?.user),
      };

      saveAuthSession(session);
      const permissions = await fetchUserPermissions(session.authid);
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
    <form onSubmit={handleLogin}>
      <div className="mb-6">
        <input
          className="bg-[#e9ebf4] border-none rounded-md p-3 text-sm w-full text-[#172b4d]"
          type="text"
          name="username"
          placeholder="Username/Email/Mobile No."
          onChange={handleChange}
        />
      </div>

      <div className="mb-6 relative">
        <input
          className="bg-[#e9ebf4] border-none rounded-md p-3 text-sm w-full text-[#172b4d]"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <span className="absolute right-5 top-3.5 text-gray-500 cursor-pointer" onClick={() => {
          setShowPassword(!showPassword);
        }}>{!showPassword ? <FaEye /> : <FaEyeSlash />}  </span>
      </div>
      <div className="flex justify-between items-center text-sm mb-4">
        <div className="flex items-center">
          <input type="checkbox" id="remember" className="mr-2" />
          <label htmlFor="" className="text-sm text-gray-600">Remember Me</label>
        </div>

        <Link to="/forgot-password" className="text-blue-500 hover:underline">Forgot Password ?</Link>
      </div>
      {/* Form submit already calls handleLogin, so button click should not call it again. */}
      <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-primary/90 font-medium  text-sm mb-4">
        {loading ? <Spinner /> : "Sign In"}
      </button>
    </form>
  );
}

export default LoginForm;
