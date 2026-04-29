import express, { json } from "express";
import cors from "cors";
import videoRoutes from "./routes/video.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";


const app = express();

app.use(cors());
app.use(json());
app.use("/api/video", videoRoutes);
app.use(errorHandler);

export default app;