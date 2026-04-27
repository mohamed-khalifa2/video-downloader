import ytDownloader from "yt-dlp-exec";
import plimit from "p-limit";
const limit = plimit(3);


const handleSingleVideo = async (url) => {
  const info = await ytDownloader(url, {
      dumpSingleJson: true
    });

    const formats = info.formats
      .filter(format => format.url && format.ext === "mp4")
      .map(format => ({
        quality: format.format_note || format.format_id,
        url: format.url
      }));

      return {
      title: info.title,
      thumbnail: info.thumbnail,
      formats
    };
}

const isYouTubePlaylist = (url) => {
  return url.includes("list=");
};



const analyze = async (url) => {

  if (isYouTubePlaylist(url)) {
    const info = await ytDownloader(url, {
    dumpSingleJson: true,
    flatPlaylist: true
  });

  const videos = await Promise.all(
  info.entries.map(video => limit(()=>handleSingleVideo(`https://www.youtube.com/watch?v=${video.id}`))
  )
  );

  return {
    type: "playlist",
    title: info.title,
    videos: videos
  };
  };

  return {
    type: "single",
    ...(await handleSingleVideo(url))
  };

}

export default analyze;

