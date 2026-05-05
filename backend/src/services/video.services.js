import youtubedl from "youtube-dl-exec";
import AppError from "../utils/appError.js";
import { exec } from 'node:child_process';



const isPlaylist = (url) => url.includes("list=");
const isTiktok = (url) => url.includes("tiktok.com/");

const estimateSize = (tbr, duration) => {
  if (!tbr || !duration) return 0;
  return (tbr * 1000 / 8) * duration;
};

const getBestAudio = (formats = []) =>
  formats
    .filter(f => f.vcodec === "none" && f.acodec !== "none")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

const killProcessTree = (pid) => {
  exec(`taskkill /F /T /PID ${pid}`, (err) => {
    if (err) console.error('Failed to kill process tree:', err.message)
  })
}





export const analyze = async (url) => {
  let meta;

  try {
    meta = isPlaylist(url)
      ? await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      ignoreErrors: true,
      isPlaylist:true
    })
      : await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      ignoreErrors: true,
    })
  } catch (err) {
    const msg = err.message || "";

    if (msg.includes("Unsupported URL") || msg.includes("not a valid URL")) {
      throw new AppError("Invalid URL: no supported video found", 400);
    }

    throw new AppError("Failed to fetch video info", 500);
  }
  const entries = meta.entries ?? [meta];

  if (!entries.length) {
    throw new AppError("No items found", 404);
  }

  const items = entries.map((entry) => {
    const formatsRaw = entry.formats ?? [];

    const bestAudio = getBestAudio(formatsRaw);

    const audioSize =
      bestAudio?.filesize ??
      bestAudio?.filesize_approx ??
      estimateSize(bestAudio?.tbr, entry.duration);

    const formats = !isTiktok(url)
      ? formatsRaw
          .filter(f => f.vcodec !== "none" && f.acodec === "none" && f.ext === "mp4")
          .map(f => ({
            format_id: f.format_id,
            quality: f.resolution,
            fps: f.fps,
            size:
              (f.filesize ??
                f.filesize_approx ??
                estimateSize(f.tbr, entry.duration)) + (audioSize || 0),
          }))
      : formatsRaw
          .filter(f => f.format_note === null) // to get the formats without watermark
          .map(f => ({
            format_id: f.format_id,
            quality: f.resolution,
            fps: f.fps,
            size:
              f.filesize ??
              f.filesize_approx ??
              estimateSize(f.tbr, entry.duration),
          }));

    return {
      title:entry.title,
      duration:entry.duration,
      thumbnail:entry.thumbnail, 
      videoUrl:entry.webpage_url ?? entry.url,
      formats,
    };
  });

  return {
    title: meta.title,
    totalItems: entries.length,
    items,
  };
};


export const download = async (url, formatId, req, res) => {
  if (!url || !formatId) {
    throw new AppError("Missing params", 400);
  }

  const safeName = `video-${Date.now()}.mp4`;

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);

  let intentionalKill = false 

  const subprocess = youtubedl.exec(url, {
    format: `${formatId}+bestaudio/best`,
    mergeOutputFormat: "mp4",
    output: "-"
  });

  subprocess.stdout.pipe(res);

  req.on('close', () => {         
    intentionalKill = true
    killProcessTree(subprocess.pid)
  });

  subprocess.catch((err) => {
    if (intentionalKill) return 
    console.error('Subprocess error:', err)
  })
};