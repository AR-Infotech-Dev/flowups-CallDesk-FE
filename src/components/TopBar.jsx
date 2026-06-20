import { Building2, ChevronDown, LogOut, UserRound, } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import NotificationBell from "./ui/NotificationBell";
import LoadingBar from "./LoadingBar";
import { useAuth } from "@auth/components/AuthProvider";
import Clock from "@components/ui/Clock"

const getCompanyName = (user = {}) => user?.company_name || "";

function TopBar({ onLogout }) {
  const navigate = useNavigate();
  const { authSession } = useAuth() || {};

  const [isLoggingOut, setLoggingOut] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [isProfileOpen, setProfileOpen] = useState(false);

  const profileMenuRef = useRef(null);

  const user = useMemo(
    () => authSession?.user || storedUser || {},
    [authSession?.user, storedUser]
  );

  const companyName = getCompanyName(user);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setStoredUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error("User parse error", error);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const getInitials = (name = "") => name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setLoggingOut(true);
    setTimeout(async () => {
      await onLogout?.();
      setLoggingOut(false);
    }, 1200);
  };

  return (
    <div className="topbar-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="p-2">
            <h5 className="relative text-slate-600 font-bold text-sm">Welcome back, {user?.name || "User"}
              <span className="ml-1 absolute animate-bounce">👋</span>
            </h5>
            <h5 className="capitalize relative text-xs">
               {user?.role_slug || "User"}
            </h5>
          </div>
        </div>
        <div className="topbar-right">
          {companyName && (
            <span className="topbar-company" title={companyName}>
              
              <Building2 size={14} />
              <span>{companyName}</span>
            </span>
          )}

          <NotificationBell />

          <div className="topbar-profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <span className="topbar-profile-ring">
                {getInitials(user?.name)}
              </span>

              <span className="topbar-profile-name">
                {user?.name || "User"}
              </span>

              <ChevronDown
                size={13}
                className={isProfileOpen ? "is-open" : ""}
              />
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-user">
                  <span className="topbar-profile-ring">
                    {getInitials(user?.name)}
                  </span>

                  <div className="profile-dropdown-copy">
                    <span>{user?.name || "User"}</span>
                    <small>
                      {user?.role || user?.role_name || "Account"}
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                >
                  <UserRound size={14} />
                  Profile
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Spinner classNames="mx-1" />
                  ) : (
                    <LogOut size={14} />
                  )}
                  Logout
                </button>
              </div>
            )}
          </div>
          <Clock />

        </div>
      </header>

      <LoadingBar />
    </div>
  );
}

export default TopBar;
