import '../auth/styles/auth.css';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { makeRequest } from "../api/httpClient";
import { saveAuthSession, savePermissions } from "./authStorage";
import { useAuth } from "./AuthProvider";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Spinner from '../components/ui/Spinner';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const normalizePermissionMap = (payload = {}) => {
    const source =
      payload?.permissions ||
      payload?.data?.permissions ||
      payload?.data ||
      payload;

    if (Array.isArray(source)) {
      return source.reduce((accumulator, item) => {
        const menuId = item?.menu_id || item?.menuID || item?.menuId || item?.id;
        if (menuId) accumulator[String(menuId)] = item;
        return accumulator;
      }, {});
    }

    return source && typeof source === "object" ? source : {};
  };

  const fetchAndStorePermissions = async (userId) => {
    if (!userId) {
      savePermissions({});
      return {};
    }

    const res = await makeRequest(`/permissions/${userId}`, {
      method: "GET",
    });

    if (!res?.success) {
      savePermissions({});
      return {};
    }

    const permissions = normalizePermissionMap(res);
    savePermissions(permissions);
    return permissions;
  };

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
      const res = await makeRequest("login", {
        method: "POST",
        body: {
          username: form.username,
          password: form.password
        }
      });
      
      if (!res.success) {
        console.log(res,111);
        toast.error(res.message);
        return;
      }

      const session = {
        token: res?.token,
        user: res?.user,
        authid: res?.user.adminID
      };

      saveAuthSession(session);
      await fetchAndStorePermissions(session.authid);
      login(session);
      toast.success("Login success");
      navigate("/users");
    } catch (error) {
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

        <a href="" className="text-blue-500 hover:underline">Forgot Password ?</a>
      </div>
      <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-primary/90 font-medium  text-sm mb-4" onClick={handleLogin}>
        {loading ? <Spinner /> : "Sign In"}
      </button>
    </form>
  );
}

export default LoginForm;
