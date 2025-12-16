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
        const username = req.username;
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            username: user.username,
            wins: user.gamesWon,
            losses: user.gamesLost,
            dateCreated: user.dateCreated.toISOString().split('T')[0],
            token: token
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching user information' });
    }
}

async function update(req, res) {
    try {
        const username = req.username; 
        const { outcome } = req.body; 

        if (!outcome || (outcome !== 'win' && outcome !== 'loss')) {
            return res.status(400).json({ message: 'Invalid outcome. Must be "win" or "loss"' });
        }

        const updateData = {};
        if (outcome === 'win') {
            updateData.$inc = { gamesWon: 1 };
        } else {
            updateData.$inc = { gamesLost: 1 };
        }

        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            updateData,
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Game result updated',
            wins: updatedUser.gamesWon,
            losses: updatedUser.gamesLost
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error updating user' });
    }
}

async function remove(req, res) {
    try {
        const username = req.username; 
        const deletedUser = await User.findOneAndDelete({ username: username });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User account deleted successfully' });
    
    } catch (err) {
        return res.status(500).json({ message: 'Error deleting user' });
    }
}

module.exports = {
    create,
    getUserInfo,
    update,
    delete: remove
};
