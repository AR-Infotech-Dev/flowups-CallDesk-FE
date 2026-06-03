import {
  ChevronDown,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import { APP_NAME } from "../api/config";
import NotificationBell from "./ui/NotificationBell";
import LoadingBar from "./LoadingBar";

function TopBar({ onLogout }) {
  const navigate = useNavigate();
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("User parse error");
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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
          <h1>{APP_NAME}</h1>
        </div>

        <div className="topbar-center">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search" readOnly />
          </div>
        </div>

        <div className="topbar-right">
          <NotificationBell />

          <div className="topbar-profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="topbar-profile-ring">
                {getInitials(user?.name)}
              </span>
              <span className="topbar-profile-name">{user?.name || "User"}</span>
              <ChevronDown size={13} className={isProfileOpen ? "is-open" : ""} />
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-user">
                  <span className="topbar-profile-ring">
                    {getInitials(user?.name)}
                  </span>
                  <div className="profile-dropdown-copy">
                    <span>{user?.name || "User"}</span>
                    <small>{user?.role || user?.role_name || "Account"}</small>
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
                  {isLoggingOut ? <Spinner classNames="mx-1" /> : <LogOut size={14} />}
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
