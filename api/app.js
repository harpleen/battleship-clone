const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const godmodeRoutes = require("./routes/godmode");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/api/godmode", godmodeRoutes);

module.exports = app;