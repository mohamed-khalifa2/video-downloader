import { Router } from "express";
import { analyzeVideo } from "../controllers/video.controller.js";
const router = Router();

router.post("/analyze", analyzeVideo);

export default router;
