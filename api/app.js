const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const godmodeRoutes = require("./routes/godmode");
const leaderboardRoutes = require("./routes/leaderboard");

const app = express();

// Allow multiple origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "https://battleship-clone-rho.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

app.use("/users", userRoutes);
app.use("/api/godmode", godmodeRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

module.exports = app;