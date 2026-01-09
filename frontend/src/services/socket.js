import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket = null;

export const initializeSocket = () => {
    if (!socket || socket.disconnected) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket || socket.disconnected) {
        return initializeSocket();
    }
    return socket;
};

export const connectSocket = () => {
    const socket = getSocket();
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};