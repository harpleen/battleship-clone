const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);

module.exports = app;