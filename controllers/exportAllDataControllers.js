// import fs from "fs";
// import csv from "csv-parser";
// import VideoStat from "../model/urlmodel.js";
// import DailyViews from "../model/dailyviewmodel.js";
// import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

// export const uploadCSV = async (req, res) => {
//   const filePath = req.file.path;
//   const results = [];
//   const today = new Date().toISOString().split("T")[0];

//   try {
//     // 1. Fetch all existing links
//     const existing = await VideoStat.find({}, { youtubelink: 1, facebooklink: 1 });
//     const existingYoutubeLinks = new Set(existing.map(item => item.youtubelink));
//     const existingFacebookLinks = new Set(existing.map(item => item.facebooklink));

//     // 2. Parse CSV
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (row) => results.push(row))
//       .on("end", async () => {
//         const newLinks = [];

//         for (const row of results) {
//           const yt = row.youtubelink;
//           const fb = row.facebooklink;

//           if (!existingYoutubeLinks.has(yt) && !existingFacebookLinks.has(fb)) {
//             await VideoStat.create({ youtubelink: yt, facebooklink: fb });
//             newLinks.push({ youtubelink: yt, facebooklink: fb });
//           }
//         }

//         // 3. Fetch ALL links (new + old) from DB
//         const allLinks = await VideoStat.find();

//         for (const link of allLinks) {
//           const youtubeViews = await getYoutubeViews(link.youtubelink);
//           const facebookViews = await getFacebookViews(link.facebooklink);
//           const totalViews = youtubeViews + facebookViews;

//           // Save to DailyViews
//           await DailyViews.create({
//             youtubelink: link.youtubelink,
//             facebooklink: link.facebooklink,
//             youtubeViews,
//             facebookViews,
//             totalViews,
//             date: today,
//           });
//         }

       

//         fs.unlinkSync(filePath);
//         res.json({
//           success: true,
//           message: `Uploaded ${newLinks.length} new links. Views for all ${allLinks.length} links recorded.`,
//         });
//       });
//   } catch (err) {
//     fs.unlinkSync(filePath);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };


import fs from "fs";
import path from "path";
import { Parser } from "json2csv";
import VideoStat from "../model/urlmodel.js";


export const getPaginatedVideos = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [videos, totalCount] = await Promise.all([
      VideoStat.find().skip(skip).limit(limit).lean(),
      VideoStat.countDocuments(),
    ]);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      data: videos,
    });
  } catch (err) {
    console.error("Pagination error:", err);
    res.status(500).json({ error: "Pagination failed" });
  }
};



export const exportAllDataToCSV = async (req, res) => {
  try {

      const filter = {
      // youtubelink: { $ne: " " },
      // facebooklink: { $ne: " " },
      youtubechannel: { $ne: "Unknown" },
      facebookchannel: { $ne: "Unknown" },
    };

    const allVideos = await VideoStat.find(filter).lean();

    if (!allVideos || allVideos.length === 0) {
      return res.status(404).json({ message: "No video stats found" });
    }

    const fields = [
      "youtubechannel",
      "youtubelink",
      "youtubeViews",
      "facebookchannel",
      "facebooklink",
      "facebookViews",
      "totalViews", 
      {
        label: "Date",
        value: row => new Date(row.uploadDate).toLocaleString(),
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(allVideos);

    const fileName = `video_stats_${Date.now()}.csv`;
    const filePath = path.join("tmp", fileName);

    fs.mkdirSync("tmp", { recursive: true });
    fs.writeFileSync(filePath, csv);

    res.download(filePath, fileName, err => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Download failed.");
      }
      fs.unlink(filePath, () => {}); 
    });
  } catch (error) {
    console.error("Export CSV Error:", error);
    res.status(500).json({ error: "Failed to export video stats" });
  }
};
