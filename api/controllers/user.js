const User = require("../models/user");
const { generateToken } = require("../lib/token");
const bcrypt = require("bcrypt");

async function create(req, res) {
  const { username, password, confirmPassword } = req.body;
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(400).json({ message: "Username already exists" });
  }
}

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token, user: { username: user.username, id: user._id } });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
}

async function getUserInfo(req, res) {
  try {
    const user = await User.findById(req.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send back single player AND pvp stats
    res.status(200).json({
      username: user.username,
      rankedPoints: user.rankedPoints || 1000,
      wins: user.pvpStats ? user.pvpStats.wins : 0,
      losses: user.pvpStats ? user.pvpStats.losses : 0,
      gamesPlayed: (user.pvpStats?.wins || 0) + (user.pvpStats?.losses || 0),
      difficultyStats: user.difficultyStats, // Keep existing single player stats
      gameHistory: user.gameHistory
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
}

// --- NEW LEADERBOARD FUNCTION ---
async function getLeaderboard(req, res) {
  try {
    // Get top 10 players sorted by rankedPoints (High to Low)
    const topPlayers = await User.find()
      .sort({ rankedPoints: -1 })
      .limit(10)
      .select("username rankedPoints pvpStats"); 

    res.status(200).json(topPlayers);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
}

async function update(req, res) {
  // Placeholder - keep if you have specific update logic
  res.status(200).json({ message: "Update placeholder" });
}

async function deleteUser(req, res) {
  // Placeholder - keep if you have specific delete logic
  res.status(200).json({ message: "Delete placeholder" });
}

module.exports = {
  create,
  login,
  getUserInfo,
  update,
  delete: deleteUser,
  getLeaderboard // <--- CRITICAL: THIS WAS MISSING
};