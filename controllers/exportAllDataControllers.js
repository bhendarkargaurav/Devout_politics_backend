
import fs from "fs";
import path from "path";
import { Parser } from "json2csv";
import VideoStat from "../model/urlmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

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

    // get data based on date || date range
    const { uploadDate, startDate, endDate } = req.query;
    if (uploadDate) {
      const start = new Date(uploadDate);
      const end = new Date(uploadDate);
      end.setHours(23, 59, 59, 999);

      filter.uploadDate = {
        $gte: start,
        $lte: end,
      };
    } else if (startDate || endDate) {
      filter.uploadDate = {};
      if (startDate) filter.uploadDate.$gte = new Date(startDate);
      if (endDate) filter.uploadDate.$lte = new Date(endDate);
    }

    const allVideos = await VideoStat.find(filter).lean();

    if (!allVideos || allVideos.length === 0) {
      return res.status(404).json({ message: "No video stats found" });
    }

    const fields = [
      "youtubechannel",
      "youtubelink",
      "youtubeViews",
      "youtubeLikes",
      "youtubeComments",
      "facebookchannel",
      "facebooklink",
      "facebookViews",
      "facebookLikes",
      "facebookComments",
      "portallink",
      "portalchannel",
      "totalViews",
      {
        label: "Date",
        value: (row) => new Date(row.uploadDate).toLocaleString(),
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(allVideos);

    const fileName = `video_stats_${Date.now()}.csv`;
    const filePath = path.join("tmp", fileName);

    fs.mkdirSync("tmp", { recursive: true });
    fs.writeFileSync(filePath, csv);

    res.download(filePath, fileName, (err) => {
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





export const updatedviewsbydate = async (req, res) => {
   res.status(200).json({
    success: true,
    message: "Refresh Done",
  });
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date query param is required" });
    }

    const selectedDate = new Date(date);
    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);

    //Find all records from that exact date
    const oldRecords = await VideoStat.find({
      uploadDate: {
        $gte: selectedDate,
        $lte: endOfDate,
      },
    });

    if (oldRecords.length === 0) {
      return res.status(404).json({ message: "No records found for this date" });
    }

    //Update each record with latest views
    for (const record of oldRecords) {
      const updatedYoutubeViews = await getYoutubeViews(record.youtubelink);
      const updatedFacebookViews = await getFacebookViews(record.facebooklink);
      const updatedTotalViews = updatedYoutubeViews + updatedFacebookViews;

      await VideoStat.updateOne(
        { _id: record._id },
        {
          $set: {
            youtubeViews: updatedYoutubeViews,
            facebookViews: updatedFacebookViews,
            totalViews: updatedTotalViews,
          },
        }
      );
    }

    res.json({
      message: `Updated ${oldRecords.length} record(s) for date ${date}`,
      updatedData: oldRecords,
    });
  } catch (error) {
    console.error("View update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};






// tommorow will check for fast uproch
export const Aupdatedviewsbydate = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Refresh Done",
  });

  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date query param is required" });
    }

    const selectedDate = new Date(date);
    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);

    // Find all records from that exact date
    const oldRecords = await VideoStat.find({
      uploadDate: {
        $gte: selectedDate,
        $lte: endOfDate,
      },
    });

    if (oldRecords.length === 0) {
      return res.status(404).json({ message: "No records found for this date" });
    }

    // Fetch updated views in parallel
    const updatedRecords = await Promise.all(
      oldRecords.map(async (record) => {
        const [updatedYoutubeViews, updatedFacebookViews] = await Promise.all([
          getYoutubeViews(record.youtubelink),
          getFacebookViews(record.facebooklink),
        ]);

        return {
          _id: record._id,
          youtubeViews: updatedYoutubeViews,
          facebookViews: updatedFacebookViews,
          totalViews: updatedYoutubeViews + updatedFacebookViews,
        };
      })
    );

    //Perform bulk update
    const bulkOps = updatedRecords.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            youtubeViews: record.youtubeViews,
            facebookViews: record.facebookViews,
            totalViews: record.totalViews,
          },
        },
      },
    }));

    await VideoStat.bulkWrite(bulkOps);

    // Send updated info back
    res.json({
      message: `Updated ${oldRecords.length} record(s) for date ${date}`,
      updatedData: updatedRecords, // showing updated view data
    });
  } catch (error) {
    console.error("View update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
