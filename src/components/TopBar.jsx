import {
  Bell,
  ChevronDown,
  Command,
  Search,
} from "lucide-react";

import { useState, useEffect } from "react";
import Spinner from "./ui/Spinner";
import { APP_NAME } from "../api/config";
import NotificationBell from "./ui/NotificationBell";
import LoadingBar from "./LoadingBar";

function TopBar({ onLogout }) {
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.log("User parse error");
    }
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
            <input type="text" value="Search" readOnly />
          </div>
        </div>

        <div className="topbar-right">

          <button
            className="top-link flex gap-2"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut && <Spinner classNames={"mx-4"} />}
            Logout
          </button>

          <NotificationBell />

          {/* USER */}
          <button className="topbar-profile flex items-center gap-2">
            <span className="topbar-profile-ring">
              {getInitials(user?.name)}
            </span>

            <span className="text-sm font-medium">
              {user?.name || "User"}
            </span>

            {/* <ChevronDown size={14} /> */}
          </button>

        </div>
      </header>
        <LoadingBar />
    </div>
  );
}

export default TopBar;
