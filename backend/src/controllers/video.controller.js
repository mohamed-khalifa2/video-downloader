const videoService = require("../services/video.services");

exports.analyzeVideo = async (req, res) => {
  const { url } = req.body;

  try {
    const result = await videoService.analyze(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};