const User = require('../models/user');
const bcrypt = require('bcrypt');
const { generateToken } = require('../lib/token');

function isValid(password) {
    if (password.length < 8) {
        return false;
    }
    if (!password.split('').some(char => '0123456789'.includes(char))) {
        return false;
    }
    if (!password.split('').some(char => '!@£$.?#&-'.includes(char))) {
        return false;
    }
    return true;
}

async function create(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (username.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
        return res.status(400).json({ message: 'All fields must be completed' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!isValid(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long, with at least one number and one special character (!@£$.?#&-)' })
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });

    user
        .save()
        .then((user) => {
            console.log('User created')
            return res.status(201).json({ message: 'User created' });
        })
        .catch((err) => {
            if (err.code === 11000) { // Mongo DB error for violating the unique constraint
                return res.status(409).json({ message: 'Account with this Username already exists' });
            }
            return res.status(400).json({ message: 'Error creating user' });
        });
}

async function getUserInfo(req, res) {
    try {
        const user = await User.findById(req.user_id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const calculateAccuracy = (stats) => {
            if (stats.shotsFired === 0) return 0;
            return Number(((stats.hits / stats.shotsFired) * 100).toFixed(2));
        };

        const token = generateToken(user._id);

        return res.status(200).json({
            username: user.username,
            wins: user.gamesWon,
            losses: user.gamesLost,
            totalAccuracy: user.totalAccuracy,
            totalTimePlayed: user.totalTimePlayed,
            dateCreated: user.dateCreated.toISOString().split('T')[0],
            difficultyStats: {
                easy: {
                    wins: user.difficultyStats.easy.wins,
                    losses: user.difficultyStats.easy.losses,
                    accuracy: calculateAccuracy(user.difficultyStats.easy)
                },
                medium: {
                    wins: user.difficultyStats.medium.wins,
                    losses: user.difficultyStats.medium.losses,
                    accuracy: calculateAccuracy(user.difficultyStats.medium)
                },
                hard: {
                    wins: user.difficultyStats.hard.wins,
                    losses: user.difficultyStats.hard.losses,
                    accuracy: calculateAccuracy(user.difficultyStats.hard)
                }
            },
            token: token
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching user information' });
    }
}

async function update(req, res) {
    try {
        const { outcome, difficulty, shotsFired, hits, duration } = req.body; 

        if (!outcome || !difficulty || shotsFired === undefined || hits === undefined || duration === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields: outcome, difficulty, shotsFired, hits, duration' 
            });
        }
        if (outcome !== 'win' && outcome !== 'loss') {
            return res.status(400).json({ message: 'Invalid outcome. Must be "win" or "loss"' });
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ message: 'Invalid difficulty. Must be "easy", "medium", or "hard"' });
        }
        if (shotsFired < 0 || hits < 0 || hits > shotsFired) {
            return res.status(400).json({ message: 'Invalid shotsFired or hits values' });
        }
        if (duration < 0) {
            return res.status(400).json({ message: 'Invalid duration. Must be a positive number' });
        }

        const currentUser = await User.findById(req.user_id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newTotalShots = currentUser.totalShotsFired + shotsFired;
        const newTotalHits = currentUser.totalHits + hits;
        
        const newTotalAccuracy = newTotalShots > 0 
            ? Number(((newTotalHits / newTotalShots) * 100).toFixed(2)) 
            : 0;
        
        const gameAccuracy = shotsFired > 0 
            ? Number(((hits / shotsFired) * 100).toFixed(2)) 
            : 0;

        const updateData = {
            $inc: {
                [`games${outcome === 'win' ? 'Won' : 'Lost'}`]: 1,
                totalShotsFired: shotsFired,
                totalHits: hits,
                totalTimePlayed: duration,
                [`difficultyStats.${difficulty}.${outcome === 'win' ? 'wins' : 'losses'}`]: 1,
                [`difficultyStats.${difficulty}.shotsFired`]: shotsFired,
                [`difficultyStats.${difficulty}.hits`]: hits
            },
            $set: {
                totalAccuracy: newTotalAccuracy
            },
            $push: {
                gameHistory: {
                    date: new Date(),
                    difficulty: difficulty,
                    outcome: outcome,
                    shotsFired: shotsFired,
                    hits: hits,
                    accuracy: gameAccuracy,
                    duration: duration
                }
            }
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.user_id,
            updateData,
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found during update' });
        }

        const calculateDifficultyAccuracy = (stats) => {
            if (stats.shotsFired === 0) return 0;
            return Number(((stats.hits / stats.shotsFired) * 100).toFixed(2));
        };

        return res.status(200).json({
            message: 'Game result and statistics updated successfully',
            totals: {
                wins: updatedUser.gamesWon,
                losses: updatedUser.gamesLost,
                totalAccuracy: updatedUser.totalAccuracy,
                totalTimePlayed: updatedUser.totalTimePlayed
            },
            difficultyStats: {
                easy: {
                    wins: updatedUser.difficultyStats.easy.wins,
                    losses: updatedUser.difficultyStats.easy.losses,
                    accuracy: calculateDifficultyAccuracy(updatedUser.difficultyStats.easy)
                },
                medium: {
                    wins: updatedUser.difficultyStats.medium.wins,
                    losses: updatedUser.difficultyStats.medium.losses,
                    accuracy: calculateDifficultyAccuracy(updatedUser.difficultyStats.medium)
                },
                hard: {
                    wins: updatedUser.difficultyStats.hard.wins,
                    losses: updatedUser.difficultyStats.hard.losses,
                    accuracy: calculateDifficultyAccuracy(updatedUser.difficultyStats.hard)
                }
            }
        });
    } catch (err) {
        console.error('Update error:', err);
        return res.status(500).json({ message: 'Error updating user and game statistics' });
    }
}

async function remove(req, res) {
    try {
        const deletedUser = await User.findByIdAndDelete(req.user_id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User account deleted successfully' });
    
    } catch (err) {
        return res.status(500).json({ message: 'Error deleting user' });
    }
}

async function login(req, res) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    
    return res.status(200).json({
      message: 'Login successful',
      token: token,
      username: user.username,
      userId: user._id
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  create,
  login,     
  getUserInfo,
  update,
  delete: remove
};