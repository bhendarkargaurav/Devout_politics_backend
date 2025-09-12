
import fs from "fs";
import path from "path";
import { Parser } from "json2csv";
import VideoStat from "../model/urlmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/testapiiFetchers.js";
// import uploadStatus from "../middleware/uploadStatusMiddleware.js";
import updateStatus from "../middleware/updateStatusMiddleware.js"
       
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


/// export the channel data using the platform type yt or fb and channelName
export const exportChannelData = async (req, res) => {
  try {
    const { channelType, channelName } = req.query;

    if (!channelType || !channelName) {
      return res.status(400).json({ success: false, message: "Channel type and channel name are required"});
    }

    let query = {};
    let fields = [];

    if (channelType === 'youtube') {
      query = { youtubechannel: channelName };
      fields = ['youtubelink', 'youtubeViews'];
    } else if (channelType === 'facebook') {
      query = { facebookchannel: channelName };
      fields = ['facebooklink', 'facebookViews'];
    } else {
      return res.status(400).json({ success: false, message: "Invalid channel type" });
    }

    const channelData = await VideoStat.find(query)
      .select(fields.join(' ') + ' -_id')
      .lean();

    if (channelData.length === 0) {
      return res.status(404).json({ success: false, message: "No data found for this channel" });
    }
    // Convert to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(channelData);   

    res.header('Content-Type', 'text/csv');
    res.attachment(`${channelName}_${channelType}_data.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting channel data",
      error: error.message,
    });
  }
};



//Updating old data for a date and date range perfectly and showing 
// how much data is remaing to update:
export const updatedviewsbydate = async (req, res) => {
  try {
    const { date, initialDate, endDate } = req.query;

    let query = {};

    if (date) {
      // Single date
      const selectedDate = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.uploadDate = {
        $gte: selectedDate,
        $lte: endOfDay,
      };
    } else if (initialDate && endDate) {
      // Date range
      const start = new Date(initialDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.uploadDate = {
        $gte: start,
        $lte: end,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide either `date` or both `initialDate` and `endDate`.",
      });
    }

    // Fetch records
    const records = await VideoStat.find(query);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No records found for the specified date(s).",
      });
    }

    const updatedRecords = [];
    const safeNumbers = (num) => (Number.isFinite(num) ? num : 0);

    // Set upload status tracking
    updateStatus.isUpdating = true;
    updateStatus.dataToUpdate= records.length;

    for (const record of records) {
      try {
        const {
          youtubeViews: updatedYoutubeViews,
          youtubeLikes: updatedYoutubeLikes,
          youtubeComments: updatedYoutubeComments,
        } = await getYoutubeViews(record.youtubelink);

        const {
          views: fbViews,
          likes: fbLikes,
          comments: fbComments,
        } = await getFacebookViews(record.facebooklink);

        const totalViews =
          safeNumbers(updatedYoutubeViews) + safeNumbers(fbViews);

        await VideoStat.updateOne(
          { _id: record._id },
          {
            $set: {
              youtubeViews: safeNumbers(updatedYoutubeViews),
              youtubeLikes: safeNumbers(updatedYoutubeLikes),
              youtubeComments: safeNumbers(updatedYoutubeComments),
              facebookViews: safeNumbers(fbViews),
              facebookLikes: safeNumbers(fbLikes),
              facebookComments: safeNumbers(fbComments),
              totalViews,
            },
          }
        );

        updatedRecords.push({
          _id: record._id,
          youtubelink: record.youtubelink,
          facebooklink: record.facebooklink,
          uploadDate: record.uploadDate,
          youtubeViews: safeNumbers(updatedYoutubeViews),
          facebookViews: safeNumbers(fbViews),
          totalViews,
        });

        updateStatus.dataToUpdate--; // Decrement count
        console.log(`Remaining: ${updateStatus.dataToUpdate}`); // Log remaining updates
    

        console.log(` Updated: ${record._id}`);
      } catch (err) {
        console.error(` Failed to update record ${record._id}:`, err.message);
      }
    }

    // Reset upload status
    updateStatus.isUpdating = false;
    updateStatus.dataToUpdate = 0;

    res.status(200).json({
      success: true,
      message: `Updated ${updatedRecords.length} records`,
      updatedData: updatedRecords,
    });
  } catch (error) {
    console.error("Error updating views:", error);
    updateStatus.isUpdating = false;
    updateStatus.dataToUpdate = 0;

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
