const jwt = require("jsonwebtoken");
const User = require("../models/user");

// In-memory storage
let waitingQueue = [];
const activeGames = {}; // { roomId: { p1: socketId, p2: socketId, p1Id: userId, p2Id: userId } }
const socketToRoom = {}; // { socketId: roomId }

// Helper function to emit queue updates to all connected sockets
const emitQueueUpdate = (io) => {
    io.emit("queue_update", { playersInQueue: waitingQueue.length });
};

module.exports = (io) => {
    // --- MIDDLEWARE: Authentication ---
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: payload.sub }; // Attach user ID to the socket
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    // --- HELPER: Save Game Results to DB (UPDATED for PvP stats) ---
    const saveGameResult = async (winnerSocketId, loserSocketId, method, gameStats = {}) => {
        const roomId = socketToRoom[winnerSocketId] || socketToRoom[loserSocketId];
        if (!roomId || !activeGames[roomId]) return;

        const game = activeGames[roomId];
        const winnerId = game.p1 === winnerSocketId ? game.p1Id : game.p2Id;
        const loserId = game.p1 === loserSocketId ? game.p1Id : game.p2Id;
        const winnerName = game.p1 === winnerSocketId ? game.p1Name : game.p2Name;
        const loserName = game.p1 === loserSocketId ? game.p1Name : game.p2Name;
        
        // Get stats if provided, otherwise use defaults
        const {
            winnerShots = 0,
            winnerHits = 0,
            loserShots = 0,
            loserHits = 0,
            duration = 0
        } = gameStats;

        // Calculate accuracies
        const winnerAccuracy = winnerShots > 0 ? Number(((winnerHits / winnerShots) * 100).toFixed(2)) : 0;
        const loserAccuracy = loserShots > 0 ? Number(((loserHits / loserShots) * 100).toFixed(2)) : 0;

        // Clean up memory
        delete socketToRoom[game.p1];
        delete socketToRoom[game.p2];
        delete activeGames[roomId];

        try {
            // Update Winner with PvP stats
            await User.findByIdAndUpdate(winnerId, {
                $inc: { 
                    gamesWon: 1,
                    "pvpStats.wins": 1,
                    "pvpStats.shotsFired": winnerShots,
                    "pvpStats.hits": winnerHits,
                    totalShotsFired: winnerShots,
                    totalHits: winnerHits,
                    totalTimePlayed: duration,
                    rankedPoints: 25
                },
                $set: {
                    "pvpStats.accuracy": winnerAccuracy
                },
                $push: {
                    gameHistory: {
                        date: new Date(),
                        gameType: "pvp",
                        difficulty: "pvp",
                        outcome: "win",
                        opponent: loserName,
                        shotsFired: winnerShots,
                        hits: winnerHits,
                        accuracy: winnerAccuracy,
                        duration: duration
                    }
                }
            });

            // Update Loser with PvP stats
            await User.findByIdAndUpdate(loserId, {
                $inc: { 
                    gamesLost: 1,
                    "pvpStats.losses": 1,
                    "pvpStats.shotsFired": loserShots,
                    "pvpStats.hits": loserHits,
                    totalShotsFired: loserShots,
                    totalHits: loserHits,
                    totalTimePlayed: duration,
                    rankedPoints: -10
                },
                $set: {
                    "pvpStats.accuracy": loserAccuracy
                },
                $push: {
                    gameHistory: {
                        date: new Date(),
                        gameType: "pvp",
                        difficulty: "pvp",
                        outcome: "loss",
                        opponent: winnerName,
                        shotsFired: loserShots,
                        hits: loserHits,
                        accuracy: loserAccuracy,
                        duration: duration
                    }
                }
            });

            console.log(`PvP Game Over. Winner: ${winnerId}, Loser: ${loserId}`);

        } catch (err) {
            console.error("Failed to save PvP game stats:", err);
        }
    };

    io.on("connection", async (socket) => {
        // Fetch the user's real name from DB for the UI
        let playerName = "Unknown";
        try {
            const user = await User.findById(socket.user.id);
            if (user) playerName = user.username;
        } catch (e) {
            console.error("Error fetching user name:", e);
        }

        console.log(`User Connected: ${playerName} (${socket.id})`);

        // Send initial queue status to newly connected socket
        socket.emit("queue_update", { playersInQueue: waitingQueue.length });

        // --- QUEUE STATUS REQUEST ---
        socket.on("get_queue_status", () => {
            socket.emit("queue_update", { playersInQueue: waitingQueue.length });
        });

        // --- MATCHMAKING ---
        socket.on("join_queue", () => {
            // Prevent joining if already queued
            if (waitingQueue.find(p => p.userId === socket.user.id)) return;

            waitingQueue.push({
                socketId: socket.id,
                userId: socket.user.id,
                name: playerName,
                socket: socket
            });

            emitQueueUpdate(io);

            if (waitingQueue.length >= 2) {
                const player1 = waitingQueue.shift();
                const player2 = waitingQueue.shift();
                
                const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                player1.socket.join(roomId);
                player2.socket.join(roomId);

                // Store Room & User IDs with names
                activeGames[roomId] = { 
                    p1: player1.socketId, 
                    p2: player2.socketId, 
                    p1Id: player1.userId,
                    p2Id: player2.userId,
                    p1Name: player1.name,
                    p2Name: player2.name,
                    rematchRequests: new Set(),
                    startTime: Date.now()
                };

                socketToRoom[player1.socketId] = roomId;
                socketToRoom[player2.socketId] = roomId;

                io.to(roomId).emit("match_found", {
                    roomId,
                    opponent: { id: player2.userId, name: player2.name },
                    isTurn: true
                });

                io.to(player2.socketId).emit("match_found", {
                    roomId,
                    opponent: { id: player1.userId, name: player1.name },
                    isTurn: false 
                });

                emitQueueUpdate(io);
            }
        });

        // --- LEAVE QUEUE ---
        socket.on("leave_queue", () => {
            waitingQueue = waitingQueue.filter(p => p.socketId !== socket.id);
            emitQueueUpdate(io);
        });

        // --- GAMEPLAY ---
        socket.on("fire_shot", ({ roomId, index }) => {
            socket.to(roomId).emit("opponent_fired", { index });
        });

        socket.on("shot_result", ({ roomId, index, isHit, isSunk, isGameOver, shotsFired, hits, duration }) => {
            // Forward the result to the opponent so they see the red/green peg
            socket.to(roomId).emit("shot_feedback", { index, isHit, isSunk, isGameOver });

            if (isGameOver) {
                const loserSocketId = socket.id;
                const winnerSocketId = activeGames[roomId].p1 === socket.id 
                    ? activeGames[roomId].p2 
                    : activeGames[roomId].p1;

                // Calculate game duration
                const gameDuration = duration || Math.floor((Date.now() - activeGames[roomId].startTime) / 1000);

                // Save game stats - winner gets loser's stats for shots/hits
                saveGameResult(winnerSocketId, loserSocketId, "normal", {
                    winnerShots: shotsFired || 0,
                    winnerHits: hits || 0,
                    loserShots: shotsFired || 0, // In a real game, you'd track both players' stats
                    loserHits: hits || 0,
                    duration: gameDuration
                });
            }
        });

        // --- LEAVING & DISCONNECTS ---
        const handleLeave = (socketId) => {
            const roomId = socketToRoom[socketId];
            
            // Remove from waiting queue
            waitingQueue = waitingQueue.filter(p => p.socketId !== socketId);
            emitQueueUpdate(io);
            
            if (roomId && activeGames[roomId]) {
                // If game is active, the leaver loses automatically
                const game = activeGames[roomId];
                const winnerSocketId = game.p1 === socketId ? game.p2 : game.p1;
                
                // Notify the winner
                io.to(roomId).emit("opponent_left");
                
                // Calculate game duration
                const gameDuration = Math.floor((Date.now() - game.startTime) / 1000);
                
                // Save stats (Leaver loses, Stayer wins)
                saveGameResult(winnerSocketId, socketId, "forfeit", {
                    duration: gameDuration
                });
            }
        };

        socket.on("leave_game", () => {
            handleLeave(socket.id);
        });

        socket.on("disconnect", () => {
            console.log("User Disconnected", socket.id);
            handleLeave(socket.id);
        });
    });
};