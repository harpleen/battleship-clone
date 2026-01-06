require("dotenv").config();
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const app = require("./app.js");
const { connectToDatabase } = require("./db/db.js");

// 1. Create HTTP Server
const server = http.createServer(app);

// 2. Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all connections (Simplifies Vercel/Render connection)
    methods: ["GET", "POST"]
  }
});

// 3. Register Socket Handlers
require("./socket/socketHandler")(io);

// 4. Connect & Listen
connectToDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});