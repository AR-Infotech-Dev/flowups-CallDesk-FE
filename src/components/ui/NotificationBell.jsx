import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { makeRequest } from "../../api/httpClient";
import { formatRelativeTime } from "../../utils/common";
import { messageTone } from "../../../assets/sounds";
import socket from "../../socket";

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
            const res = await makeRequest("/notifications/unread-count");
            if (!res.success) return;
            const total = Number(res.total || 0);
            setCount(total);
            localStorage.setItem("notification_count", total);
        } catch (error) {
            console.log(error);
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
                console.log(error);
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
                console.log(error);
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
            console.log("SOCKET EVENT:", data);

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
        socket.on("connect", () => {
            console.log("Socket Reconnected");
            socket.emit("join_room", userId);
        });

        return () => {
            socket.off("new_notification", onNotification);
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
                    className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-100">
                        <h3 className="text-sm font-semibold">
                            Notifications
                        </h3>

                        {!!count && (
                            <span className="text-xs text-gray-500">
                                {count} unread
                            </span>
                        )}
                    </div>

                    <div className="max-h-105 overflow-y-auto">
                        {list.length ? (
                            list.map((item) => (
                                <div
                                    key={item.notification_id || Math.random()}
                                    onClick={() =>
                                        handleNotificationClick(item)
                                    }
                                    className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${item.is_read === "n"
                                        ? "bg-blue-50"
                                        : ""
                                        }`}
                                >
                                    <h4 className="text-sm font-semibold">
                                        {item.title}
                                    </h4>

                                    <p className="text-sm text-gray-600 mt-1">
                                        {item.message}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatRelativeTime(item.created_date)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500">
                                No notifications found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
