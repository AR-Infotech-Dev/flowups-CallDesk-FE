import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, logoutFromLocalAuth } from "./authStorage";
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
  }, []);

  const value = useMemo(() => ({
    authSession,
    login(session) {
      setAuthSession(session);
    },
    logout() {
      logoutFromLocalAuth();
      setAuthSession(null);
      setTimeout(()=>{
        navigate('/login');
      },2000);
    }
  }), [authSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;