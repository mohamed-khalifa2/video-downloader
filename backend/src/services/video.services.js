import youtubedl from "yt-dlp-exec";
import AppError from "../utils/appError.js";
import { execFile } from "child_process";

const isPlaylist = (url) => url.includes("/playlist");
const isTiktok = (url) => url.includes("tiktok.com/");
const estimateSize = (tbr, duration) => {
  if (!tbr || !duration) return 0;
  return ((tbr * 1000) / 8) * duration;
};

const stripPlaylistParam = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("v")) {
      // it's a single video, remove the list param
      parsed.searchParams.delete("list");
      parsed.searchParams.delete("index");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}; // if it has list param, ytdlp treats it as playlist

// a helper function for estimateSize() only to get the estimated size of files after merging them
const getBestAudio = (formats = []) =>
  formats
    .filter((f) => f.vcodec === "none" && f.acodec !== "none")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

//ytdlp uses ffmpeg under hood, stopping the ytdlp process alone won't stop ffmpeg merging process
const killProcessTree = (pid) => {
  execFile("taskkill", ["/F", "/T", "/PID", pid.toString()], (err) => {
    if (err?.message.includes("not found")) return;
    if (err) console.error("Failed to kill process tree:", err.message);
  });
};

export const analyze = async (url) => {
  const cleanUrl = stripPlaylistParam(url);
  let meta;
  try {
    meta = await youtubedl(cleanUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      ignoreErrors: true,
      skipDownload: true,
      flatPlaylist: isPlaylist(cleanUrl), // get the meta data only if it's a playlist for better performance
    });
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

    const formats = !isTiktok(url) // getting the video only if it's not a tiktok video, but in tiktok video and audio are muxed
      ? formatsRaw
          .filter(
            (f) =>
              f.vcodec !== "none" && f.acodec === "none" && f.ext === "mp4",
          )
          .map((f) => ({
            format_id: f.format_id,
            quality: f.resolution ?? "Unknown",
            fps: f.fps ?? 0,
            size:
              (f.filesize ??
                f.filesize_approx ??
                estimateSize(f.tbr, entry.duration)) + (audioSize || 0) ?? 0,
          }))
      : formatsRaw
          .filter((f) => f.format_note === null) // to get the formats without watermark
          .map((f) => ({
            format_id: f.format_id,
            quality: f.resolution ?? "Unknown",
            fps: f.fps ?? 0,
            size:
              f.filesize ??
              f.filesize_approx ??
              estimateSize(f.tbr, entry.duration) ??
              0,
          }));

    return {
      title: entry.title ?? "video",
      duration: entry.duration ?? 0,
      thumbnail: entry.thumbnail ?? entry.thumbnails[0].url,
      videoUrl: entry.webpage_url ?? entry.url ?? "not found",
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

  const safeName = `video-${Date.now()}`;

  res.setHeader("Content-Type", "video/x-matroska");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="video-${Date.now()}.mkv"`,
  );

  let intentionalKill = false;
  const subprocess = youtubedl.exec(url, {
    format: `${formatId}+bestaudio/best`,
    mergeOutputFormat: "mkv",
    output: "-",
  });

  subprocess.stdout.pipe(res);

  req.on("close", () => {
    intentionalKill = true;
    killProcessTree(subprocess.pid);
  });

  subprocess.catch((err) => {
    if (intentionalKill) return;
    console.error("Subprocess error:", err);
  });
};
