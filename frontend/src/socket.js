import { io } from "socket.io-client";

const URL = "https://battleship-reuc.onrender.com";

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'] // 'polling' adds a backup if websockets fail
});