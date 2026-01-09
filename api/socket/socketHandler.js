const jwt = require("jsonwebtoken");
const User = require("../models/user"); 

let waitingQueue = []; // Stores players waiting for a match
const activeGames = {}; // Stores active room data

module.exports = (io) => {
    // Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: payload.sub || payload.userId }; 
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    // Connection and gameplay
    io.on("connection", async (socket) => {
        console.log(`User connected: ${socket.id}`);
        
        let user;
        try {
            user = await User.findById(socket.user.id);
            if (!user) return socket.disconnect();
        } catch (err) {
            return socket.disconnect();
        }
        
        // Attach user data to socket
        socket.userData = { 
            id: user._id, 
            username: user.username, 
            rankedPoints: user.rankedPoints || 1000 
        };

        // Joins queue
        socket.on("join_queue", () => {
            const existing = waitingQueue.find(p => p.socketId === socket.id);
            if (existing) return;

            waitingQueue.push({ socketId: socket.id, ...socket.userData });
            console.log(`${user.username} joined queue. Total: ${waitingQueue.length}`);
            
            // Try to match players
            if (waitingQueue.length >= 2) {
                const p1 = waitingQueue.shift();
                const p2 = waitingQueue.shift();
                const roomId = `room_${Date.now()}`;
                
                const s1 = io.sockets.sockets.get(p1.socketId);
                const s2 = io.sockets.sockets.get(p2.socketId);

                // Ensure both are still connected
                if (s1 && s2) {
                    s1.join(roomId);
                    s2.join(roomId);
                    
                    // Assign Turn 
                    io.to(p1.socketId).emit("match_found", { roomId, opponent: p2.username, isTurn: true });
                    io.to(p2.socketId).emit("match_found", { roomId, opponent: p1.username, isTurn: false });
                }
            }
        });

        // Fire shot 
        socket.on("fire_shot", ({ roomId, index }) => {
            socket.to(roomId).emit("opponent_fired", { index });
        });

        // Shot Feedback
        socket.on("shot_feedback", ({ roomId, hit, index, sunk }) => {
            socket.to(roomId).emit("shot_result", { hit, index, sunk });
        });

        // Game Over
        socket.on("game_over", async ({ roomId, winner }) => {
            if (winner) {
                await User.findByIdAndUpdate(socket.userData.id, { 
                    $inc: { "pvpStats.wins": 1, rankedPoints: 25, "pvpStats.gamesPlayed": 1 } 
                });
            } else {
                await User.findByIdAndUpdate(socket.userData.id, { 
                    $inc: { "pvpStats.losses": 1, rankedPoints: -15, "pvpStats.gamesPlayed": 1 } 
                });
            }
        });

        socket.on("disconnect", () => {
            waitingQueue = waitingQueue.filter(p => p.socketId !== socket.id);
        });
    });
};