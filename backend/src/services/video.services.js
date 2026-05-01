import ytdlp from 'yt-dlp-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import AppError from '../utils/appError.js';
ffmpeg.setFfmpegPath(ffmpegPath);



const getBestAudio = (formats) =>
  formats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.ext === 'm4a')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0]
  ?? formats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];



const fetchMeta = async (url) => {
 const meta = await ytdlp(url, {
    dumpSingleJson: true,
    noWarnings: true,
    flatPlaylist: true
  });

  const totalItems = meta.entries?.length ?? 1;
  return totalItems;
};

const fetchPage = async (url, start, end) => {
  return ytdlp(url, {
    dumpSingleJson: true,
    noWarnings: true,
    preferFreeFormats: true,
    ignoreErrors: true,           
    playlistStart: start,
    playlistEnd: end
  });
};

export const analyze = async (url, page = 1, limit = 10) => {
  const start = (page - 1) * limit + 1;
  const end = page * limit;

  let totalItems, info;
  try {
    totalItems = await fetchMeta(url);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Unsupported URL') || msg.includes('is not a valid URL'))
      throw new AppError('Invalid URL: no supported video found at this link', 400);
    throw new AppError('Failed to fetch video info', 500);
  }

  try {
    info = await fetchPage(url, start, end);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Video unavailable') || msg.includes('This video is private'))
      throw new AppError('Video unavailable or private', 404);
    throw new AppError('Failed to fetch page', 500);
  }

  const entries = info.entries ?? [info];

  if (!entries.length) {
    throw new AppError('No items found for this page', 404);
  }

  const totalPages = Math.ceil(totalItems / limit);

  const items = entries.map(entry => {
    const formats = (entry.formats ?? [])
      .filter(f =>
        f.vcodec !== 'none' &&
        f.acodec === 'none' &&
        f.ext === 'mp4' &&
        f.vcodec?.includes('avc1')
      )
      .map(f => ({
        format_id: f.format_id,
        quality: f.format_note || `${f.height}p`,
        size: f.filesize || 0,
        fps: f.fps
      }));

    return {
      title: entry.title,
      duration: entry.duration,
      thumbnail: entry.thumbnail,
      videoUrl: entry.webpage_url,
      formats
    };
  });

  return {
    title: info.title,
    page,
    totalItems,
    totalPages,
    items
  };
};




export const download = async (url, formatId, res) => {
  const info = await ytdlp(url, { dumpSingleJson: true });
  const video = info.formats.find(f => f.format_id === formatId);
  const audio = getBestAudio(info.formats);

  if (!video || !audio) throw new AppError("Format not found", 404);

 const safeTitle = (info.title || "video")
  .replace(/[^\w\s.-]/g, "")   // remove anything unsafe
  .replace(/\s+/g, "_")        // replace spaces
  .substring(0, 100)           // limit length
  .trim();


  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
  
  await new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(video.url)
      .input(audio.url)
      .outputOptions([
        "-c:v copy",
        "-c:a copy",
        "-movflags", "frag_keyframe+empty_moov+default_base_moof"
      ])
      .format("mp4");

    command
      .on("error", () => reject(new AppError("FFmpeg processing failed", 500)))
      .on("end", resolve)
      .pipe(res, { end: true });

    res.on("close", () => command.kill("SIGKILL"));
  });
};