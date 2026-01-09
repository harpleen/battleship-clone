const Match = require('../models/match');
const MatchmakingQueue = require('../models/matchmakingQueue');
const User = require('../models/user');
const JWT = require('jsonwebtoken');

// Helper: Generate random ship positions
function generateRandomPositions() {
    const positions = new Set();
    const ships = [];
    
    const canPlaceShip = (startPos, length, isHorizontal) => {
        const row = Math.floor(startPos / 10);
        const col = startPos % 10;
        
        for (let i = 0; i < length; i++) {
            let pos;
            if (isHorizontal) {
                if (col + i >= 10) return false;
                pos = startPos + i;
            } else {
                if (row + i >= 10) return false;
                pos = startPos + (i * 10);
            }
            
            if (positions.has(pos)) return false;
            
            const currentRow = Math.floor(pos / 10);
            const currentCol = pos % 10;
            const adjacentOffsets = [-11, -10, -9, -1, 1, 9, 10, 11];
            
            for (let offset of adjacentOffsets) {
                const adjacentPos = pos + offset;
                const adjacentRow = Math.floor(adjacentPos / 10);
                const adjacentCol = adjacentPos % 10;
                
                if (adjacentPos >= 0 && adjacentPos < 100) {
                    if (Math.abs(adjacentRow - currentRow) <= 1 && 
                        Math.abs(adjacentCol - currentCol) <= 1) {
                        if (positions.has(adjacentPos)) return false;
                    }
                }
            }
        }
        return true;
    };
    
    const placeShip = (length) => {
        let attempts = 0;
        while (attempts < 100) {
            const startPos = Math.floor(Math.random() * 100);
            const isHorizontal = Math.random() < 0.5;
            
            if (canPlaceShip(startPos, length, isHorizontal)) {
                const shipPositions = [];
                for (let i = 0; i < length; i++) {
                    const pos = isHorizontal ? startPos + i : startPos + (i * 10);
                    positions.add(pos);
                    shipPositions.push(pos);
                }
                ships.push({
                    length,
                    positions: shipPositions,
                    orientation: isHorizontal ? 'horizontal' : 'vertical'
                });
                return true;
            }
            attempts++;
        }
        return false;
    };
    
    const shipLengths = [5, 4, 3, 2];
    shipLengths.forEach(length => placeShip(length));
    
    return { positions: Array.from(positions), ships };
}

// Helper: Calculate Elo rating change
function calculateEloChange(winnerMmr, loserMmr) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserMmr - winnerMmr) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerMmr - loserMmr) / 400));
    
    const winnerChange = Math.round(K * (1 - expectedWinner));
    const loserChange = Math.round(K * (0 - expectedLoser));
    
    return { winnerChange, loserChange };
}

// Helper: Check if all ships destroyed
function checkGameOver(strikes, battleshipPositions) {
    return battleshipPositions.every(pos => strikes.includes(pos));
}

// Disconnect timeout tracker
const disconnectTimeouts = new Map();

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);
        
        // Join matchmaking queue
        socket.on('join_queue', async ({ token }) => {
            console.log('📥 join_queue event received, socket:', socket.id);
            
            try {
                if (!token) {
                    console.error('❌ No token provided');
                    socket.emit('error', { message: 'No authentication token provided' });
                    return;
                }

                console.log('🔍 Verifying token...');
                const payload = JWT.verify(token, process.env.JWT_SECRET);
                const userId = payload.sub;
                console.log('✅ Token verified for user:', userId);
                
                const user = await User.findById(userId);
                
                if (!user) {
                    console.error('❌ User not found:', userId);
                    socket.emit('error', { message: 'User not found' });
                    return;
                }
                
                console.log('✅ User found:', user.username);
                
                // Check if already in queue
                const existingQueue = await MatchmakingQueue.findOne({ userId });
                if (existingQueue) {
                    console.log('⚠️ User already in queue, updating socket ID');
                    existingQueue.socketId = socket.id;
                    await existingQueue.save();
                    socket.emit('queue_joined', { position: await MatchmakingQueue.countDocuments({ status: 'waiting' }) });
                    return;
                }
                
                // Add to queue
                console.log('➕ Adding user to queue...');
                await MatchmakingQueue.create({
                    userId,
                    username: user.username,
                    mmr: user.mmr,
                    socketId: socket.id,
                    status: 'waiting'
                });
                
                const queuePosition = await MatchmakingQueue.countDocuments({ status: 'waiting' });
                console.log('✅ Queue joined! Position:', queuePosition);
                
                socket.emit('queue_joined', { position: queuePosition });
                
                // Try to find a match
                console.log('🔍 Looking for match...');
                const waitingPlayers = await MatchmakingQueue.find({ status: 'waiting' }).limit(2);
                console.log('👥 Waiting players:', waitingPlayers.length);
                
                if (waitingPlayers.length >= 2) {
                    console.log('🎮 Creating match!');
                    const [player1, player2] = waitingPlayers;
                    const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    const match = await Match.create({
                        roomId,
                        players: [
                            {
                                userId: player1.userId,
                                username: player1.username,
                                socketId: player1.socketId,
                                mmr: player1.mmr
                            },
                            {
                                userId: player2.userId,
                                username: player2.username,
                                socketId: player2.socketId,
                                mmr: player2.mmr
                            }
                        ],
                        gameState: {
                            currentTurn: 0,
                            player1: {
                                battleships: generateRandomPositions(),
                                strikes: [],
                                powerupUsage: { cluster: 0, missiles: 0, nuke: 0 }
                            },
                            player2: {
                                battleships: generateRandomPositions(),
                                strikes: [],
                                powerupUsage: { cluster: 0, missiles: 0, nuke: 0 }
                            }
                        },
                        status: 'active',
                        startedAt: new Date()
                    });
                    
                    console.log('✅ Match created:', roomId);
                    
                    await MatchmakingQueue.updateMany(
                        { userId: { $in: [player1.userId, player2.userId] } },
                        { status: 'matched' }
                    );
                    
                    io.to(player1.socketId).socketsJoin(roomId);
                    io.to(player2.socketId).socketsJoin(roomId);
                    
                    console.log('📤 Sending match_found to both players');
                    
                    io.to(player1.socketId).emit('match_found', {
                        roomId,
                        playerIndex: 0,
                        opponent: { username: player2.username, mmr: player2.mmr },
                        gameState: {
                            yourBattleships: match.gameState.player1.battleships,
                            opponentBattleships: { positions: [], ships: [] },
                            yourStrikes: [],
                            opponentStrikes: [],
                            currentTurn: 0,
                            isYourTurn: true
                        }
                    });
                    
                    io.to(player2.socketId).emit('match_found', {
                        roomId,
                        playerIndex: 1,
                        opponent: { username: player1.username, mmr: player1.mmr },
                        gameState: {
                            yourBattleships: match.gameState.player2.battleships,
                            opponentBattleships: { positions: [], ships: [] },
                            yourStrikes: [],
                            opponentStrikes: [],
                            currentTurn: 0,
                            isYourTurn: false
                        }
                    });
                    
                    await MatchmakingQueue.deleteMany({ userId: { $in: [player1.userId, player2.userId] } });
                    console.log('✅ Match setup complete!');
                }
                
            } catch (error) {
                console.error('❌ Join queue error:', error);
                console.error('Error stack:', error.stack);
                socket.emit('error', { message: 'Failed to join queue: ' + error.message });
            }
        });
        
        // Leave matchmaking queue
        socket.on('leave_queue', async ({ token }) => {
            console.log('🚪 leave_queue event received');
            try {
                const payload = JWT.verify(token, process.env.JWT_SECRET);
                const userId = payload.sub;
                
                const result = await MatchmakingQueue.deleteOne({ userId });
                console.log(`✅ Removed ${result.deletedCount} queue entry for user ${userId}`);
                socket.emit('queue_left');
            } catch (error) {
                console.error('Leave queue error:', error);
            }
        });
        
        // Player makes a strike
        socket.on('player_strike', async ({ roomId, position, powerup, token }) => {
            try {
                const payload = JWT.verify(token, process.env.JWT_SECRET);
                const userId = payload.sub;
                
                const match = await Match.findOne({ roomId, status: 'active' });
                if (!match) {
                    socket.emit('error', { message: 'Match not found' });
                    return;
                }
                
                const playerIndex = match.players.findIndex(p => p.userId.toString() === userId.toString());
                if (playerIndex === -1) {
                    socket.emit('error', { message: 'You are not in this match' });
                    return;
                }
                
                if (match.gameState.currentTurn !== playerIndex) {
                    socket.emit('error', { message: 'Not your turn' });
                    return;
                }
                
                const opponentIndex = playerIndex === 0 ? 1 : 0;
                const playerState = playerIndex === 0 ? match.gameState.player1 : match.gameState.player2;
                const opponentState = playerIndex === 0 ? match.gameState.player2 : match.gameState.player1;
                
                let newStrikes = [...playerState.strikes];
                let isHit = false;
                let message = '';
                
                if (powerup) {
                    let targetPositions = [];
                    
                    if (powerup === 'cluster') {
                        const row = Math.floor(position / 10);
                        const col = position % 10;
                        targetPositions = [position];
                        const diagonals = [
                            { r: row - 1, c: col - 1 },
                            { r: row - 1, c: col + 1 },
                            { r: row + 1, c: col - 1 },
                            { r: row + 1, c: col + 1 }
                        ];
                        diagonals.forEach(d => {
                            if (d.r >= 0 && d.r < 10 && d.c >= 0 && d.c < 10) {
                                targetPositions.push(d.r * 10 + d.c);
                            }
                        });
                        playerState.powerupUsage.cluster++;
                    } else if (powerup === 'missiles') {
                        const available = [];
                        for (let i = 0; i < 100; i++) {
                            if (!playerState.strikes.includes(i)) available.push(i);
                        }
                        for (let i = 0; i < 6 && available.length > 0; i++) {
                            const idx = Math.floor(Math.random() * available.length);
                            targetPositions.push(available.splice(idx, 1)[0]);
                        }
                        playerState.powerupUsage.missiles++;
                    } else if (powerup === 'nuke') {
                        const row = Math.floor(position / 10);
                        const col = position % 10;
                        for (let i = 0; i < 10; i++) {
                            targetPositions.push(row * 10 + i);
                            targetPositions.push(i * 10 + col);
                        }
                        playerState.powerupUsage.nuke++;
                    }
                    
                    targetPositions = [...new Set(targetPositions)].filter(p => !playerState.strikes.includes(p));
                    newStrikes = [...playerState.strikes, ...targetPositions];
                    
                    const hits = targetPositions.filter(p => opponentState.battleships.positions.includes(p));
                    isHit = hits.length > 0;
                    message = `💥 ${powerup.toUpperCase()} used! ${hits.length} hit${hits.length !== 1 ? 's' : ''}!`;
                    
                } else {
                    if (playerState.strikes.includes(position)) {
                        socket.emit('error', { message: 'Already struck this position' });
                        return;
                    }
                    
                    newStrikes.push(position);
                    isHit = opponentState.battleships.positions.includes(position);
                    message = isHit ? '🎯 HIT!' : '💧 MISS!';
                }
                
                if (playerIndex === 0) {
                    match.gameState.player1.strikes = newStrikes;
                } else {
                    match.gameState.player2.strikes = newStrikes;
                }
                
                const gameOver = checkGameOver(newStrikes, opponentState.battleships.positions);
                
                if (gameOver) {
                    match.status = 'completed';
                    match.winner = match.players[playerIndex].userId;
                    match.winnerUsername = match.players[playerIndex].username;
                    match.loser = match.players[opponentIndex].userId;
                    match.loserUsername = match.players[opponentIndex].username;
                    match.endReason = 'all_ships_destroyed';
                    match.completedAt = new Date();
                    
                    const { winnerChange, loserChange } = calculateEloChange(
                        match.players[playerIndex].mmr,
                        match.players[opponentIndex].mmr
                    );
                    
                    match.mmrChanges = {
                        winner: winnerChange,
                        loser: loserChange
                    };
                    
                    await User.findByIdAndUpdate(match.players[playerIndex].userId, {
                        $inc: { 
                            mmr: winnerChange, 
                            pvpWins: 1, 
                            pvpTotalGames: 1,
                            currentWinStreak: 1
                        },
                        $max: { highestMmr: match.players[playerIndex].mmr + winnerChange },
                        $push: {
                            pvpHistory: {
                                date: new Date(),
                                opponent: match.players[opponentIndex].username,
                                outcome: 'win',
                                mmrChange: winnerChange,
                                endReason: 'all_ships_destroyed'
                            }
                        }
                    });
                    
                    await User.findByIdAndUpdate(match.players[opponentIndex].userId, {
                        $inc: { 
                            mmr: loserChange, 
                            pvpLosses: 1, 
                            pvpTotalGames: 1
                        },
                        $set: { currentWinStreak: 0 },
                        $push: {
                            pvpHistory: {
                                date: new Date(),
                                opponent: match.players[playerIndex].username,
                                outcome: 'loss',
                                mmrChange: loserChange,
                                endReason: 'all_ships_destroyed'
                            }
                        }
                    });
                    
                    const winner = await User.findById(match.players[playerIndex].userId);
                    if (winner.currentWinStreak > winner.longestWinStreak) {
                        await User.findByIdAndUpdate(match.players[playerIndex].userId, {
                            longestWinStreak: winner.currentWinStreak
                        });
                    }
                    
                    await match.save();
                    
                    io.to(roomId).emit('game_over', {
                        winner: match.players[playerIndex].username,
                        loser: match.players[opponentIndex].username,
                        winnerMmrChange: winnerChange,
                        loserMmrChange: loserChange,
                        reason: 'all_ships_destroyed'
                    });
                    
                } else {
                    if (!isHit) {
                        match.gameState.currentTurn = opponentIndex;
                    }
                    match.gameState.turnStartTime = new Date();
                    await match.save();
                    
                    io.to(roomId).emit('strike_result', {
                        playerIndex,
                        position,
                        positions: powerup ? newStrikes.slice(playerState.strikes.length - newStrikes.length) : [position],
                        isHit,
                        message,
                        currentTurn: match.gameState.currentTurn,
                        powerup
                    });
                }
                
            } catch (error) {
                console.error('Player strike error:', error);
                socket.emit('error', { message: 'Strike failed' });
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log('❌ Client disconnected:', socket.id);
            
            try {
                const queueEntry = await MatchmakingQueue.findOne({ socketId: socket.id });
                if (queueEntry) {
                    await MatchmakingQueue.deleteOne({ socketId: socket.id });
                    console.log(`✅ Removed disconnected user from queue: ${queueEntry.username}`);
                }
                
                const match = await Match.findOne({
                    'players.socketId': socket.id,
                    status: 'active'
                });
                
                if (match) {
                    const playerIndex = match.players.findIndex(p => p.socketId === socket.id);
                    if (playerIndex !== -1) {
                        match.players[playerIndex].connected = false;
                        match.players[playerIndex].lastSeen = new Date();
                        await match.save();
                        
                        const opponentIndex = playerIndex === 0 ? 1 : 0;
                        io.to(match.players[opponentIndex].socketId).emit('opponent_disconnected');
                        
                        const timeoutId = setTimeout(async () => {
                            const updatedMatch = await Match.findById(match._id);
                            if (updatedMatch && !updatedMatch.players[playerIndex].connected) {
                                updatedMatch.status = 'completed';
                                updatedMatch.winner = updatedMatch.players[opponentIndex].userId;
                                updatedMatch.winnerUsername = updatedMatch.players[opponentIndex].username;
                                updatedMatch.loser = updatedMatch.players[playerIndex].userId;
                                updatedMatch.loserUsername = updatedMatch.players[playerIndex].username;
                                updatedMatch.endReason = 'disconnect';
                                updatedMatch.completedAt = new Date();
                                
                                const { winnerChange, loserChange } = calculateEloChange(
                                    updatedMatch.players[opponentIndex].mmr,
                                    updatedMatch.players[playerIndex].mmr
                                );
                                
                                updatedMatch.mmrChanges = {
                                    winner: winnerChange,
                                    loser: loserChange - 10
                                };
                                
                                await User.findByIdAndUpdate(updatedMatch.players[opponentIndex].userId, {
                                    $inc: { 
                                        mmr: winnerChange, 
                                        pvpWins: 1, 
                                        pvpTotalGames: 1,
                                        currentWinStreak: 1
                                    },
                                    $push: {
                                        pvpHistory: {
                                            date: new Date(),
                                            opponent: updatedMatch.players[playerIndex].username,
                                            outcome: 'win',
                                            mmrChange: winnerChange,
                                            endReason: 'disconnect'
                                        }
                                    }
                                });
                                
                                await User.findByIdAndUpdate(updatedMatch.players[playerIndex].userId, {
                                    $inc: { 
                                        mmr: loserChange - 10, 
                                        pvpLosses: 1, 
                                        pvpTotalGames: 1
                                    },
                                    $set: { currentWinStreak: 0 },
                                    $push: {
                                        pvpHistory: {
                                            date: new Date(),
                                            opponent: updatedMatch.players[opponentIndex].username,
                                            outcome: 'loss',
                                            mmrChange: loserChange - 10,
                                            endReason: 'disconnect'
                                        }
                                    }
                                });
                                
                                await updatedMatch.save();
                                
                                io.to(updatedMatch.players[opponentIndex].socketId).emit('game_over', {
                                    winner: updatedMatch.players[opponentIndex].username,
                                    loser: updatedMatch.players[playerIndex].username,
                                    winnerMmrChange: winnerChange,
                                    loserMmrChange: loserChange - 10,
                                    reason: 'disconnect'
                                });
                            }
                            disconnectTimeouts.delete(match.roomId);
                        }, 10000);
                        
                        disconnectTimeouts.set(match.roomId, timeoutId);
                    }
                }
                
            } catch (error) {
                console.error('Disconnect handler error:', error);
            }
        });
        
        // Handle reconnection
        socket.on('reconnect_to_match', async ({ roomId, token }) => {
            try {
                const payload = JWT.verify(token, process.env.JWT_SECRET);
                const userId = payload.sub;
                
                const match = await Match.findOne({ roomId, status: 'active' });
                if (!match) {
                    socket.emit('error', { message: 'Match not found' });
                    return;
                }
                
                const playerIndex = match.players.findIndex(p => p.userId.toString() === userId.toString());
                if (playerIndex === -1) {
                    socket.emit('error', { message: 'You are not in this match' });
                    return;
                }
                
                if (disconnectTimeouts.has(roomId)) {
                    clearTimeout(disconnectTimeouts.get(roomId));
                    disconnectTimeouts.delete(roomId);
                }
                
                match.players[playerIndex].connected = true;
                match.players[playerIndex].socketId = socket.id;
                await match.save();
                
                socket.join(roomId);
                
                const opponentIndex = playerIndex === 0 ? 1 : 0;
                const playerState = playerIndex === 0 ? match.gameState.player1 : match.gameState.player2;
                const opponentState = playerIndex === 0 ? match.gameState.player2 : match.gameState.player1;
                
                socket.emit('reconnected', {
                    roomId,
                    playerIndex,
                    gameState: {
                        yourBattleships: playerState.battleships,
                        opponentBattleships: { positions: [], ships: [] },
                        yourStrikes: playerState.strikes,
                        opponentStrikes: opponentState.strikes,
                        currentTurn: match.gameState.currentTurn,
                        isYourTurn: match.gameState.currentTurn === playerIndex,
                        yourPowerups: playerState.powerupUsage,
                        opponentPowerups: opponentState.powerupUsage
                    }
                });
                
                io.to(match.players[opponentIndex].socketId).emit('opponent_reconnected');
                
            } catch (error) {
                console.error('Reconnect error:', error);
                socket.emit('error', { message: 'Reconnection failed' });
            }
        });
    });
};