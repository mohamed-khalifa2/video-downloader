import {analyze, download} from "../services/video.services.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from '../utils/appError.js'

// GET /api/video/analyze?url=youtube...
export const analyzeVideo =  asyncHandler(async (req, res) => {
    const { url , page } = req.query;
    if (!url) throw new AppError('URL is required', 400);
    const result = await analyze(url, page);
    res.json(result);
});


export const downloadVideo = asyncHandler(async (req, res) => {
    const { url, formatId } = req.query;
    if (!url || !formatId) throw new AppError('Missing params', 400)
    await download(url, formatId, res);
});