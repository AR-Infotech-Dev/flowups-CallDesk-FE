import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { makeRequest } from "../../api/httpClient";
import { formatRelativeTime } from "../../utils/common";
import { messageTone } from "../../../assets/sounds";
import socket from "../../socket";

let unreadCountRequest = null;
let unreadCountCache = {
    total: Number(localStorage.getItem("notification_count")) || 0,
    fetchedAt: 0,
};
const UNREAD_COUNT_CACHE_TIME = 60 * 1000;

export default function NotificationBell() {
    const navigate = useNavigate();
    const initialCount = Number(localStorage.getItem("notification_count")) || 0;
    const [count, setCount] = useState(initialCount);
    const [list, setList] = useState([]);
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);
    const openRef = useRef(false);
    const audioRef = useRef(new Audio(messageTone));

    /* ===================================================
       DESKTOP PERMISSION
    =================================================== */
    useEffect(() => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    /* ===================================================
       SHOW DESKTOP NOTIFICATION (FIXED)
    =================================================== */
    const showDesktopNotification = ({
        title = "New Notification",
        message = "",
        body = ""
    }) => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const notify = new Notification(title, {
            body: message || body,
            icon: "/favicon.ico"
        });

        notify.onclick = () => {
            window.focus();
            notify.close();
        };
        setTimeout(() => notify.close(), 5000);
    };

    /* ===================================================
       GET COUNT (ONLY ON LOAD)
    =================================================== */
    const getCount = useCallback(async () => {
        try {
            const now = Date.now();
            if (now - unreadCountCache.fetchedAt < UNREAD_COUNT_CACHE_TIME) {
                setCount(unreadCountCache.total);
                return;
            }

            if (unreadCountRequest) {
                const total = await unreadCountRequest;
                setCount(total);
                return;
            }

            unreadCountRequest = makeRequest("/notifications/unread-count").then((res) => {
                if (!res.success) return unreadCountCache.total;
                const total = Number(res.total || 0);
                unreadCountCache = { total, fetchedAt: Date.now() };
                localStorage.setItem("notification_count", total);
                return total;
            });

            const total = await unreadCountRequest;
            setCount(total);
        } catch (error) {
            console.error(error);
        } finally {
            unreadCountRequest = null;
        }
    }, []);

    /* ===================================================
       GET LIST
    =================================================== */
    const getNotifications =
        useCallback(async () => {
            try {
                const res = await makeRequest("/notifications",
                    {
                        method: "POST",
                        body: { page: 1 }
                    }
                );
                if (res.success) {
                    setList(res.data || []);
                }
            } catch (error) {
                console.error(error);
            }
        }, []);

    /* ===================================================
       MARK READ
    =================================================== */
    const readNotification =
        async (notification_id) => {
            try {
                const res = await makeRequest(`/notifications/read/${notification_id}`,
                    { method: "GET" }
                );
                if (!res.success) return;
                setList((prev) =>
                    prev.map((item) => item.notification_id === notification_id
                        ? { ...item, is_read: "y" }
                        : item
                    )
                );

                setCount((prev) => prev > 0 ? prev - 1 : 0);

            } catch (error) {
                console.error(error);
            }
        };

    /* ===================================================
       KEEP OPEN REF UPDATED
    =================================================== */
    useEffect(() => {
        openRef.current = open;
    }, [open]);

    /* ===================================================
       SOCKET INIT (FULL FIX)
    =================================================== */
    useEffect(() => {
        const userId = localStorage.getItem("_auth_id");
        if (!userId) return;

        socket.connect();

        socket.emit("join_room", userId);

        const onNotification = (data = {}) => {
            console.error("SOCKET EVENT:", data);

            /* sound */
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });

            /* desktop */
            showDesktopNotification(data);

            /* count */
            setCount((prev) => {
                const next = prev + 1;
                localStorage.setItem("notification_count", next);
                return next;
            });

            /* list */
            setList((prev) => [
                {
                    ...data,
                    is_read: "n",
                    created_date: data.created_date || new Date()
                },
                ...prev
            ]);
        };

        socket.on("new_notification", onNotification);

        /* 🔥 reconnect fix */
        const onConnect = () => {
            console.info("Socket Reconnected");
            socket.emit("join_room", userId);
        };

        socket.on("connect", onConnect);

        return () => {
            socket.off("new_notification", onNotification);
            socket.off("connect", onConnect);
            socket.disconnect();
        };

    }, []);

    /* ===================================================
       FIRST LOAD
    =================================================== */
    useEffect(() => {
        getCount();
    }, [getCount]);

    /* ===================================================
       OUTSIDE CLICK
    =================================================== */
    useEffect(() => {
        const handleClick = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);

    /* ===================================================
       TOGGLE BELL
    =================================================== */
    const openBell = async () => {
        const next = !open;
        setOpen(next);
        if (next) {
            await getNotifications();
        }
    };

    /* ===================================================
       CLICK ITEM
    =================================================== */
    const handleNotificationClick = async (item) => {
        setOpen(false);

        await readNotification(item.notification_id);

        if (item.module_name === "ticket") {
            navigate("/tickets", {
                state: {
                    openTicket: {
                        ticket_id: item.reference_id
                    }
                }
            });
        }
    };

    return (
        <div className="relative">
            <button
                onClick={openBell}
                className="topbar-utility topbar-utility-bell"
            >
                <Bell size={15} />

                {count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-semibold">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={boxRef}
                    className="absolute right-0 top-9 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
                        <h3 className="text-xs font-semibold text-slate-800">
                            Notifications
                        </h3>

                        {!!count && (
                            <span className="text-[11px] text-slate-500">
                                {count} unread
                            </span>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto notification-list-scroll">
                        {list.length ? (
                            list.map((item) => (
                                <div
                                    key={item.notification_id || Math.random()}
                                    onClick={() =>
                                        handleNotificationClick(item)
                                    }
                                    className={`px-3 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${item.is_read === "n"
                                        ? "bg-blue-50"
                                        : ""
                                        }`}
                                >
                                    <h4 className="text-xs font-semibold text-slate-800 leading-4">
                                        {item.title}
                                    </h4>

                                    <p className="text-xs text-slate-600 mt-0.5 leading-4 line-clamp-2">
                                        {item.message}
                                    </p>

                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-4">
                                        {formatRelativeTime(item.created_date)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                                No notifications found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
