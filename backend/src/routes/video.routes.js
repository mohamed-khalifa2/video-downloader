import { Router } from 'express';
import { analyzeVideo, downloadVideo } from '../controllers/video.controller.js';

const router = Router();

// GET /api/video/analyze?url=https://youtube.com/watch?v=...&page=1
router.get('/analyze', analyzeVideo);

// GET /api/video/download?url=...&formatId=137
router.get('/download', downloadVideo );

export default router;