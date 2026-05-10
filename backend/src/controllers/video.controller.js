import {analyze, download} from "../services/video.services.js";
import AppError from '../utils/appError.js'

//no need for async handler, as express 5 automatically awaits promises and forwards errors to the error handler
export const analyzeVideo =  async (req, res) => {
    const { url} = req.query;
    if (!url) throw new AppError('URL is required', 400);
    const result = await analyze(url);
    res.json(result);
};


export const downloadVideo = async (req, res) => {
    const { url, formatId } = req.query;
    if (!url || !formatId) throw new AppError('Missing params', 400)
    await download(url, formatId, req, res);
};

