const ytDownloader = require("yt-dlp-exec");


exports.analyze = async(url) => {

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
      type: info.extractor,
      title: info.title,
      formats
    };
};

