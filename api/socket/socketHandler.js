const jwt = require("jsonwebtoken");
const User = require("../models/user");

let waitingQueue = []; // Players waiting for a match
const activeGames = {}; // RoomId -> Game Data
const socketToRoom = {}; // SocketId -> RoomId

module.exports = (io) => {
    // --- AUTHENTICATION MIDDLEWARE ---
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: payload.sub };
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        console.log(`User connected: ${socket.id}`);
        
        // Fetch user details from DB
        const user = await User.findById(socket.user.id);
        if (!user) return socket.disconnect();
        
        socket.userData = {
            id: user._id,
            username: user.username,
            rankedPoints: user.rankedPoints || 1000
        };

        // --- MATCHMAKING ---
        socket.on("join_queue", () => {
            // Prevent duplicates
            if (waitingQueue.find(p => p.socketId === socket.id)) return;

            waitingQueue.push({ socketId: socket.id, ...socket.userData });
            console.log(`${user.username} joined queue. Total: ${waitingQueue.length}`);
            
            // Matchmaking Check
            if (waitingQueue.length >= 2) {
                const player1 = waitingQueue.shift();
                const player2 = waitingQueue.shift();
                
                const roomId = `room_${Date.now()}`;
                const p1Socket = io.sockets.sockets.get(player1.socketId);
                const p2Socket = io.sockets.sockets.get(player2.socketId);

                if (p1Socket && p2Socket) {
                    // Create Room
                    p1Socket.join(roomId);
                    p2Socket.join(roomId);
                    
                    socketToRoom[player1.socketId] = roomId;
                    socketToRoom[player2.socketId] = roomId;

                    activeGames[roomId] = { p1: player1.socketId, p2: player2.socketId };

                    // Notify Players (Coin flip for turn)
                    io.to(player1.socketId).emit("match_found", { roomId, opponent: player2.username, isTurn: true });
                    io.to(player2.socketId).emit("match_found", { roomId, opponent: player1.username, isTurn: false });
                }
            } else {
                socket.emit("queue_update", { playersInQueue: waitingQueue.length });
            }
        });

        // --- GAMEPLAY ---
        socket.on("fire_shot", ({ roomId, index }) => {
            socket.to(roomId).emit("opponent_fired", { index });
        });

        socket.on("shot_feedback", ({ roomId, hit, index, sunk }) => {
            // Forward the result back to the shooter so they can see if they hit
            socket.to(roomId).emit("shot_result", { hit, index, sunk });
        });

        // --- GAME OVER & STATS ---
        socket.on("game_over", async ({ roomId, winner }) => {
            const game = activeGames[roomId];
            if (!game) return;

            // Simple rating adjustment logic
            if (winner) {
                // Determine winner ID and loser ID
                // In a real app, verify this server-side to prevent cheating
                const winnerId = socket.userData.id; 
                // We trust the client for this MVP
                await User.findByIdAndUpdate(winnerId, { 
                    $inc: { "pvpStats.wins": 1, rankedPoints: 25, gamesWon: 1 } 
                });
            } else {
                // This socket lost
                 const loserId = socket.userData.id;
                 await User.findByIdAndUpdate(loserId, { 
                    $inc: { "pvpStats.losses": 1, rankedPoints: -15, gamesLost: 1 } 
                });
            }
        });

        // --- DISCONNECT ---
        socket.on("disconnect", () => {
            waitingQueue = waitingQueue.filter(p => p.socketId !== socket.id);
            const roomId = socketToRoom[socket.id];
            if (roomId) {
                socket.to(roomId).emit("opponent_left");
                delete activeGames[roomId];
                delete socketToRoom[socket.id];
            }
        });
    });
};