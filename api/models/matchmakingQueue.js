const mongoose = require("mongoose");

const MatchmakingQueueSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true 
    },
    username: { type: String, required: true },
    mmr: { type: Number, default: 1000 },
    socketId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['waiting', 'matched'],
        default: 'waiting'
    }
});

// TTL index - remove queue entries after 5 minutes if not matched
MatchmakingQueueSchema.index({ joinedAt: 1 }, { expireAfterSeconds: 300 });
MatchmakingQueueSchema.index({ status: 1 });

module.exports = mongoose.model('MatchmakingQueue', MatchmakingQueueSchema);