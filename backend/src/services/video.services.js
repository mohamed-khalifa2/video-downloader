import ytdlp from 'yt-dlp-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

const getBestAudio = (formats) => formats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none' &&f.ext ==='m4a')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0]


export const analyze = async (url, page = 1, limit = 10) => {
  const start = (page - 1) * limit + 1;
  const end = page * limit;

  const info = await ytdlp(url, {
    dumpSingleJson: true,
    playlistItems: `${start}-${end}`
  });

  
  const entries = info.entries ? info.entries : [info];
  

  const result = entries.map(entry => {
    const formats = entry.formats.filter(f =>
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
    count: result.length,
    items: result
  };
};

export const download = async (url, formatId, res) => {

  const info = await ytdlp(url, { dumpSingleJson: true });
  const video = info.formats.find(format => format.format_id === formatId);
  const audio = getBestAudio(info.formats);

  if (!video || !audio) {
    return res.status(404).json({ error: 'Format not found' });
  }


  // headers
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${info.title}.mp4"`
  );

  ffmpeg()
    .input(video.url)
    .input(audio.url)
    .outputOptions([
      '-c:v copy',
      `-c:a copy`,
      '-b:a 192k',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof'
    ])
    .format('mp4')
    .on('error', err => {
      console.error(err);
      if (!res.headersSent) res.status(500).end();
    })
    .pipe(res, { end: true });
};