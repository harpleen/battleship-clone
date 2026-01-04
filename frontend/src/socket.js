import { io } from "socket.io-client";

// Get API URL from environment variables
// Development: http://localhost:3000
// Production: https://battleship-api.onrender.com
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log('Connecting to backend:', BACKEND_URL);

// Create socket connection
export const socket = io(BACKEND_URL, {
  autoConnect: false, // Don't auto-connect, wait until we have token
  auth: (cb) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    console.log('Socket auth token:', token ? 'Present' : 'Missing');
    
    // Send token to server for authentication
    cb({ 
      token: token,
      timestamp: Date.now()
    });
  },
  transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  query: {
    clientType: 'web',
    version: '1.0.0'
  }
});

// Add event listeners for debugging
socket.on('connect', () => {
  console.log('✅ Socket.io connected successfully. ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.io connection error:', error.message);
  
  // If authentication failed, clear token
  if (error.message.includes('auth') || error.message.includes('token')) {
    localStorage.removeItem('token');
    console.log('Cleared invalid token');
  }
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket.io disconnected. Reason:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('♻️ Socket.io reconnected. Attempt:', attemptNumber);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 Socket.io reconnection attempt:', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Socket.io reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('💥 Socket.io reconnection failed');
});