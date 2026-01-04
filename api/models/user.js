const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        dateCreated: { type: Date, default: Date.now },
        
        // NEW FIELD: Ranked Points (Leaderboard)
        rankedPoints: { type: Number, default: 0 }, 

        gamesWon: { type: Number, default: 0 },
        gamesLost: { type: Number, default: 0 },
        gamesDraw: { type: Number, default: 0 },
        totalShotsFired: { type: Number, default: 0 },
        totalHits: { type: Number, default: 0 },
        totalAccuracy: { type: Number, default: 0 },
        totalTimePlayed: { type: Number, default: 0 }, 
        
        difficultyStats: {
            easy: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 }, shotsFired: {type: Number, default: 0}, hits: {type: Number, default: 0} },
            medium: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 }, shotsFired: {type: Number, default: 0}, hits: {type: Number, default: 0} },
            hard: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 }, shotsFired: {type: Number, default: 0}, hits: {type: Number, default: 0} },
        },
        
        // PvP Stats
        pvpStats: {
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 },
            draws: { type: Number, default: 0 },
            shotsFired: { type: Number, default: 0 },
            hits: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 }
        },
        
        gameHistory: [{
            date: { type: Date, default: Date.now },
            gameType: { type: String, enum: ['cpu', 'pvp'], default: 'cpu' },
            difficulty: { type: String },
            outcome: { type: String, enum: ['win', 'loss', 'draw'] },
            opponent: { type: String },
            shotsFired: { type: Number, default: 0 },
            hits: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 },
            duration: { type: Number, default: 0 }
        }]
    }
);

module.exports = mongoose.model('User', UserSchema);