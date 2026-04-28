import {analyze, download} from "../services/video.services.js";

// GET /api/video/analyze?url=youtube...
export const analyzeVideo =  async (req, res) => {
  try {
    const { url , page } = req.query;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await analyze(url, page);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze URL' });
  }
};


export const downloadVideo = async (req, res) => {
  try {
    const { url, formatId } = req.query;

    if (!url || !formatId) {
      return res.status(400).json({ error: 'Missing params' });
    }

    await download(url, formatId, res);

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
};