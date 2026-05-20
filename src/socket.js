// =======================================================
// src/socket.js
// =======================================================
import { io } from "socket.io-client";
import { API_SERVER_URL } from "./api/config";

const socket = io(API_SERVER_URL, {
    transports: ["websocket"],
    // Do not connect just because this file is imported.
    // NotificationBell will connect it only after a logged-in user is available.
    autoConnect: false,
});

export default socket;
