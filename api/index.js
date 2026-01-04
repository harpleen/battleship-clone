// backend/index.js
require("dotenv").config();
const http = require('http');
const { Server } = require("socket.io");

const app = require("./app.js");
const { connectToDatabase } = require("./db/db.js");
const registerSocketHandlers = require("./socket/socketHandler");

// 1. Create HTTP Server
const server = http.createServer(app);

// 2. Attach Socket.io to the server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // List of allowed origins - update with your actual Vercel URL
      const allowedOrigins = [
        'https://battleship-game.vercel.app',
        'https://battleship-game-*.vercel.app', // All Vercel previews
        'http://localhost:5173', // Local development
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ];
      
      // Check if the origin is in the allowed list
      if (allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          // Handle wildcard pattern matching
          const pattern = allowedOrigin.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowedOrigin === origin;
      })) {
        callback(null, true);
      } else {
        console.log('Socket.io CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  },
  transports: ['websocket', 'polling'], // Add fallback for better compatibility
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  allowEIO3: true // Support older Engine.io clients
});

// 3. Connect our socket logic
registerSocketHandlers(io);

function listenForRequests() {
  const port = process.env.PORT || 3000;
  
  // Use server.listen, NOT app.listen
  server.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║      Battleship API Server Started                    ║
╠══════════════════════════════════════════════════════╣
║  Port:        ${port.toString().padEnd(38)}║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(32)}║
║  Socket.io:   Connected                              ║
║  MongoDB:     Connecting...                          ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

// Handle MongoDB connection
connectToDatabase().then(() => {
  console.log('✅ MongoDB connected successfully');
  listenForRequests();
}).catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.log('Retrying connection in 5 seconds...');
  setTimeout(() => {
    connectToDatabase().then(() => {
      console.log('✅ MongoDB connected on retry');
      listenForRequests();
    });
  }, 5000);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${process.env.PORT || 3000} is already in use`);
    process.exit(1);
  } else {
    throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Export for testing
module.exports = { app, server, io };