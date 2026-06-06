import {
  Building2,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import NotificationBell from "./ui/NotificationBell";
import LoadingBar from "./LoadingBar";
import { useAuth } from "../auth/AuthProvider";
import { APP_NAME } from "../api/config";

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

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

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
          <div className="topbar-brand" title={APP_NAME}>
            <img
              src="/logo.png"
              alt={APP_NAME}
              className="topbar-logo"
            />
            <span className="topbar-brand-fallback">{APP_NAME}</span>
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
        </div>
      </header>

      <LoadingBar />
    </div>
  );
}

export default TopBar;
