import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, logoutFromLocalAuth } from "@auth/utils/authStorage";
import { useNavigate } from "react-router-dom";
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState(null);

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setAuthSession(session);
    }

    const handleAuthLogout = () => {
      setAuthSession(null);
      navigate("/login", { replace: true });
    };

    window.addEventListener("crm:auth-logout", handleAuthLogout);
    return () => window.removeEventListener("crm:auth-logout", handleAuthLogout);
  }, [navigate]);

  const value = useMemo(() => ({
    authSession,
    login(session) {
      setAuthSession(session);
    },
    logout() {
      logoutFromLocalAuth();
      setAuthSession(null);
      navigate("/login", { replace: true });
    }
  }), [authSession, navigate]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;



