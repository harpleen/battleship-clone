const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  
  // --- RANKED PVP STATS ---
  rankedPoints: { type: Number, default: 1000 }, // MMR Rating
  gamesWon: { type: Number, default: 0 },
  gamesLost: { type: Number, default: 0 },
  
  pvpStats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      shotsFired: { type: Number, default: 0 },
      hits: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
  },

  // --- SINGLE PLAYER STATS ---
  difficultyStats: {
      easy: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } },
      medium: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } },
      hard: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } }
  },
  
  gameHistory: [{
      date: { type: Date, default: Date.now },
      gameType: { type: String, enum: ['cpu', 'pvp'] },
      outcome: { type: String }, // 'win' or 'loss'
      opponent: { type: String }
  }]
});

const User = mongoose.model("User", UserSchema);
module.exports = User;