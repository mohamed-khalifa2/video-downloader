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


export const analyze = async (url, page = 1, limit = 10) => {
  const start = (page - 1) * limit + 1;
  const end = page * limit;

  let meta, info;
  try {
    [meta, info] = await Promise.all([
      ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        preferFreeFormats: true,
        flatPlaylist: true
      }),
      ytdlp(url, {
        dumpSingleJson: true,
        playlistItems: `${start}-${end}`
      })
    ]);
  } catch (err) {
    const msg = err.message || '';

    if (msg.includes('Unsupported URL') || msg.includes('is not a valid URL')) {
      throw new AppError('Invalid URL: no supported video found at this link', 400);
    }

    if (msg.includes('Video unavailable') || msg.includes('This video is private')) {
      throw new AppError('Video unavailable or private', 404);
    }

    // Catch-all for any other yt-dlp failure
    throw new AppError('Failed to fetch video info', 500);
  }

  const totalItems = meta.entries ? meta.entries.length : 1;
  const totalPages = Math.ceil(totalItems / limit);
  const entries = info.entries ?? [info];

  const items = entries.map(entry => {
    const formats = entry.formats
      .filter(f =>
        f.vcodec !== 'none' &&
        f.acodec === 'none' &&
        f.ext === 'mp4' &&
        f.vcodec?.includes('avc1')
      )
      .map(f => ({
        format_id: f.format_id,
        quality: f.format_note || `${f.height}p`,
        fps: f.fps
      }));

    return {
      title: entry.title,
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

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${info.title}.mp4"`);

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