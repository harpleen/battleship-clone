const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add the routes here
// Example: app.use("/api/users", userRoutes);

module.exports = app;
