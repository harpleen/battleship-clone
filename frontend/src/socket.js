import { io } from "socket.io-client";

// Select URL based on environment (Local vs Production)
const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socket = io(URL, {
    autoConnect: false, // Wait until we have a token
    transports: ['websocket']
});