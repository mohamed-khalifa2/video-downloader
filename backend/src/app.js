const express = require("express");
const cors = require("cors");
const videoRoutes = require("./routes/video.routes");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/video", videoRoutes)

module.exports = app;