import analyze from "../services/video.services.js";

export const analyzeVideo = async (req, res) => {
  const { url } = req.body;

  try {
    const result = await analyze(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};