import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket = null;

export const initializeSocket = () => {
    if (!socket) {
        console.log('🔌 Creating new socket connection to:', SOCKET_URL);
        socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('✅ Global socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Global socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Global socket connection error:', error);
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        console.log('🔌 Reconnecting socket...');
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('🚪 Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
};