// docs: https://github.com/motdotla/dotenv#%EF%B8%8F-usage
require("dotenv").config();

const app = require("./app.js");
const { connectToDatabase } = require("./db/db.js");
const http = require('http');
const { Server } = require('socket.io');
const gameSocket = require('./sockets/gameSocket');

const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize game socket handlers
gameSocket(io);

function listenForRequests() {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log("Now listening on port", port);
    console.log("🎮 Socket.io server ready for PvP matches");
  });
}

connectToDatabase().then(() => {
  listenForRequests();
});