import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import DailyViews from "../model/dailyviewmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

export const uploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch all existing links
    const existing = await VideoStat.find({}, { youtubelink: 1, facebooklink: 1 });
    const existingYoutubeLinks = new Set(existing.map(item => item.youtubelink));
    const existingFacebookLinks = new Set(existing.map(item => item.facebooklink));

    // 2. Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        const newLinks = [];

        for (const row of results) {
          const yt = row.youtubelink;
          const fb = row.facebooklink;

          if (!existingYoutubeLinks.has(yt) && !existingFacebookLinks.has(fb)) {
            await VideoStat.create({ youtubelink: yt, facebooklink: fb });
            newLinks.push({ youtubelink: yt, facebooklink: fb });
          }
        }

        // 3. Fetch ALL links (new + old) from DB
        const allLinks = await VideoStat.find();

        for (const link of allLinks) {
          const youtubeViews = await getYoutubeViews(link.youtubelink);
          const facebookViews = await getFacebookViews(link.facebooklink);
          const totalViews = youtubeViews + facebookViews;

          // Save to DailyViews
          await DailyViews.create({
            youtubelink: link.youtubelink,
            facebooklink: link.facebooklink,
            youtubeViews,
            facebookViews,
            totalViews,
            date: today,
          });
        }

       

        fs.unlinkSync(filePath);
        res.json({
          success: true,
          message: `Uploaded ${newLinks.length} new links. Views for all ${allLinks.length} links recorded.`,
        });
      });
  } catch (err) {
    fs.unlinkSync(filePath);
    res.status(500).json({ success: false, error: err.message });
  }
};
