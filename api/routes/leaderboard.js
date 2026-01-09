const express = require('express');
const User = require('../models/user');
const tokenChecker = require('../middleware/tokenChecker');

const router = express.Router();

// Get top players by MMR
router.get('/top', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        
        const topPlayers = await User.find({
            pvpTotalGames: { $gt: 0 } // Only players who have played PvP
        })
        .select('username mmr pvpWins pvpLosses pvpTotalGames currentWinStreak longestWinStreak dateCreated')
        .sort({ mmr: -1 })
        .limit(limit);
        
        const leaderboard = topPlayers.map((player, index) => ({
            rank: index + 1,
            username: player.username,
            mmr: player.mmr,
            wins: player.pvpWins,
            losses: player.pvpLosses,
            totalGames: player.pvpTotalGames,
            winRate: player.pvpTotalGames > 0 ? 
                Math.round((player.pvpWins / player.pvpTotalGames) * 100) : 0,
            currentStreak: player.currentWinStreak,
            longestStreak: player.longestWinStreak,
            memberSince: player.dateCreated
        }));
        
        res.status(200).json({ leaderboard });
        
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
});

// Get user's rank
router.get('/rank', tokenChecker, async (req, res) => {
    try {
        const user = await User.findById(req.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Count users with higher MMR
        const rank = await User.countDocuments({
            mmr: { $gt: user.mmr },
            pvpTotalGames: { $gt: 0 }
        }) + 1;
        
        const totalPlayers = await User.countDocuments({
            pvpTotalGames: { $gt: 0 }
        });
        
        res.status(200).json({
            rank,
            totalPlayers,
            mmr: user.mmr,
            wins: user.pvpWins,
            losses: user.pvpLosses,
            totalGames: user.pvpTotalGames,
            winRate: user.pvpTotalGames > 0 ? 
                Math.round((user.pvpWins / user.pvpTotalGames) * 100) : 0,
            currentStreak: user.currentWinStreak,
            longestStreak: user.longestWinStreak
        });
        
    } catch (error) {
        console.error('Rank error:', error);
        res.status(500).json({ message: 'Failed to fetch rank' });
    }
});

// Get user's match history
router.get('/history', tokenChecker, async (req, res) => {
    try {
        const user = await User.findById(req.user_id).select('pvpHistory');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Sort by date descending and limit
        const history = user.pvpHistory
            .sort((a, b) => b.date - a.date)
            .slice(0, 50);
        
        res.status(200).json({ history });
        
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

module.exports = router;