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
        let user;
        try {
            user = await User.findById(socket.user.id);
            if (!user) return socket.disconnect();
        } catch (err) {
            return socket.disconnect();
        }
        
        // Attach user data to the socket object for easy access later
        socket.userData = {
            id: user._id,
            username: user.username,
            rankedPoints: user.rankedPoints || 1000
        };

        // --- MATCHMAKING LOGIC ---
        socket.on("join_queue", () => {
            // 1. Prevent duplicates: Don't let the same socket join twice
            const alreadyInQueue = waitingQueue.find(p => p.socketId === socket.id);
            if (alreadyInQueue) return;

            // 2. Add player to the queue
            waitingQueue.push({ socketId: socket.id, ...socket.userData });
            console.log(`${user.username} joined queue. Total: ${waitingQueue.length}`);
            
            // 3. Attempt to find a match
            tryMatchmaking();
        });

        // Helper function to handle the queue logic safely
        function tryMatchmaking() {
            // We need at least 2 players to start a game
            if (waitingQueue.length < 2) {
                // Notify everyone currently waiting how many people are there
                waitingQueue.forEach(p => {
                    io.to(p.socketId).emit("queue_update", { playersInQueue: waitingQueue.length });
                });
                return;
            }

            // Peek at the first two players (Do NOT remove them yet!)
            const p1Data = waitingQueue[0];
            const p2Data = waitingQueue[1];

            // Check if their sockets are still connected
            const p1Socket = io.sockets.sockets.get(p1Data.socketId);
            const p2Socket = io.sockets.sockets.get(p2Data.socketId);

            // If Player 1 has disconnected, remove them and try again
            if (!p1Socket) {
                waitingQueue.splice(0, 1);
                return tryMatchmaking();
            }

            // If Player 2 has disconnected, remove them and try again
            if (!p2Socket) {
                waitingQueue.splice(1, 1);
                return tryMatchmaking();
            }

            // --- BOTH PLAYERS ARE VALID -> START MATCH ---
            
            // Now it is safe to remove them from the queue
            waitingQueue.splice(0, 2);

            const roomId = `room_${Date.now()}`;

            // Join both sockets to the specific Game Room
            p1Socket.join(roomId);
            p2Socket.join(roomId);
            
            // Map sockets to the room ID so we can handle disconnects later
            socketToRoom[p1Data.socketId] = roomId;
            socketToRoom[p2Data.socketId] = roomId;

            // Store game session data
            activeGames[roomId] = { p1: p1Data.socketId, p2: p2Data.socketId };

            console.log(`Match started: ${p1Data.username} vs ${p2Data.username}`);

            // Notify Players (Player 1 gets first turn, Player 2 waits)
            io.to(p1Data.socketId).emit("match_found", { roomId, opponent: p2Data.username, isTurn: true });
            io.to(p2Data.socketId).emit("match_found", { roomId, opponent: p1Data.username, isTurn: false });
        }

        // --- GAMEPLAY EVENTS ---
        socket.on("fire_shot", ({ roomId, index }) => {
            // Forward the shot to the other player in the room
            socket.to(roomId).emit("opponent_fired", { index });
        });

        socket.on("shot_feedback", ({ roomId, hit, index, sunk }) => {
            // Forward the result back to the shooter
            socket.to(roomId).emit("shot_result", { hit, index, sunk });
        });

        // --- GAME OVER & STATS ---
        socket.on("game_over", async ({ roomId, winner }) => {
            const game = activeGames[roomId];
            if (!game) return;

            // Simple rating adjustment logic
            // (In a real app, you should verify the winner server-side to prevent cheating)
            if (winner) {
                const winnerId = socket.userData.id; 
                await User.findByIdAndUpdate(winnerId, { 
                    $inc: { "pvpStats.wins": 1, rankedPoints: 25, gamesWon: 1 } 
                });
            } else {
                 const loserId = socket.userData.id;
                 await User.findByIdAndUpdate(loserId, { 
                    $inc: { "pvpStats.losses": 1, rankedPoints: -15, gamesLost: 1 } 
                });
            }
        });

        // --- DISCONNECT HANDLING ---
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            
            // 1. Remove from queue if they were waiting
            waitingQueue = waitingQueue.filter(p => p.socketId !== socket.id);
            
            // 2. Handle active game disconnection
            const roomId = socketToRoom[socket.id];
            if (roomId) {
                // Notify the opponent that the player left
                socket.to(roomId).emit("opponent_left");
                
                // Cleanup memory
                delete activeGames[roomId];
                delete socketToRoom[socket.id];
            }
        });
    });
};