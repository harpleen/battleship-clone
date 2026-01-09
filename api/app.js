const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const godmodeRoutes = require("./routes/godmode");
const leaderboardRoutes = require("./routes/leaderboard");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.use("/users", userRoutes);
app.use("/api/godmode", godmodeRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

module.exports = app;