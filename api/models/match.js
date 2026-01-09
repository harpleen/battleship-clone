const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String, required: true },
        socketId: { type: String },
        mmr: { type: Number, default: 1000 },
        connected: { type: Boolean, default: true },
        lastSeen: { type: Date, default: Date.now }
    }],
    gameState: {
        currentTurn: { type: Number, default: 0 }, // 0 or 1 (index in players array)
        turnStartTime: { type: Date, default: Date.now },
        turnTimeLimit: { type: Number, default: 10 }, // seconds
        player1: {
            battleships: {
                positions: [Number],
                ships: [{
                    length: Number,
                    positions: [Number],
                    orientation: String
                }]
            },
            strikes: [Number],
            powerupUsage: {
                cluster: { type: Number, default: 0 },
                missiles: { type: Number, default: 0 },
                nuke: { type: Number, default: 0 }
            }
        },
        player2: {
            battleships: {
                positions: [Number],
                ships: [{
                    length: Number,
                    positions: [Number],
                    orientation: String
                }]
            },
            strikes: [Number],
            powerupUsage: {
                cluster: { type: Number, default: 0 },
                missiles: { type: Number, default: 0 },
                nuke: { type: Number, default: 0 }
            }
        }
    },
    status: { 
        type: String, 
        enum: ['waiting', 'active', 'completed', 'abandoned'],
        default: 'waiting'
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    winnerUsername: String,
    loser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loserUsername: String,
    endReason: { 
        type: String, 
        enum: ['all_ships_destroyed', 'disconnect', 'timeout'],
    },
    mmrChanges: {
        winner: Number,
        loser: Number
    },
    startedAt: { type: Date },
    completedAt: { type: Date }
}, {
    timestamps: true
});

// Index for faster queries
MatchSchema.index({ roomId: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ 'players.userId': 1 });

module.exports = mongoose.model('Match', MatchSchema);