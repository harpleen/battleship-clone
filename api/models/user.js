const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        dateCreated: { type: Date, default: Date.now },
        gamesWon: { type: Number, default: 0 },
        gamesLost: { type: Number, default: 0 }
    }
);

module.exports = mongoose.model('User', UserSchema);