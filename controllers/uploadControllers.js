// update views of previous links and add channel in database
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/testapiiFetchers.js";
import uploadStatus from "../middleware/uploadStatusMiddleware.js";

export const uploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
  });

  try {
    // changes1:-
    uploadStatus.isUploading = true;
    uploadStatus.dataToUpload = 0;

    // Step 1: Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        // Step 2: Get all existing links
        const existingLinks = await VideoStat.find({}, "youtubelink facebooklink");

        const existingSet = new Set(
          existingLinks.map((doc) => `${doc.youtubelink}-${doc.facebooklink}`)
        );

        const filteredRows = results.filter((row) => {
          const key = `${row.youtubelink}-${row.facebooklink}`;
          return !existingSet.has(key); // Only keep unique (new) rows
        });

        // changes2:-
        uploadStatus.dataToUpload = filteredRows.length;

        // Step 3: Upload only non-duplicate data
        for (const row of filteredRows) {
          const { youtubeViews, youtubeLikes, youtubeComments } = await getYoutubeViews(row.youtubelink);

          const facebookViews = await getFacebookViews(row.facebooklink);
          const { views, likes, comments } = facebookViews;

          const safeNumber = (num) => (Number.isFinite(num) ? num : 0);

          await VideoStat.create({
            youtubelink: row.youtubelink,
            facebooklink: row.facebooklink,
            portallink: row.portallink || "Unknown",
            youtubeViews: safeNumber(youtubeViews),
            youtubeLikes: safeNumber(youtubeLikes),
            youtubeComments: safeNumber(youtubeComments),
            facebookViews: safeNumber(views),
            facebookLikes: safeNumber(likes),
            facebookComments: safeNumber(comments),
            youtubechannel: row.youtubechannel || "Unknown",
            facebookchannel: row.facebookchannel || "Unknown",
            portalchannel: row.portalchannel || "Unknown",
            totalViews: safeNumber(youtubeViews) + safeNumber(facebookViews),
            uploadDate: today, 
          });

          // changes3:-
          uploadStatus.dataToUpload -= 1;
        }

        // changes4:-
        uploadStatus.dataToUpload = (await VideoStat.countDocuments({ uploadDate: { $lt: today } }));

        // Update view counts for old records (uploaded before today)
        const oldRecords = await VideoStat.find({ uploadDate: { $lt: today } });

        for (const record of oldRecords) {
          const { youtubeViews: updatedYoutubeViews, youtubeLikes: updatedYoutubeLikes, youtubeComments: updatedYoutubeComments } = await getYoutubeViews(record.youtubelink);

          const { views, likes, comments } = await getFacebookViews(record.facebooklink);

          const safeNumbers = (num) => (Number.isFinite(num) ? num : 0);

          await VideoStat.updateOne(
            { _id: record._id },
            {
              $set: {
                youtubeViews: safeNumbers(updatedYoutubeViews),
                youtubeLikes: safeNumbers(updatedYoutubeLikes),
                youtubeComments: safeNumbers(updatedYoutubeComments),
                facebookViews: safeNumbers(views),
                facebookLikes: safeNumbers(likes),
                facebookComments: safeNumbers(comments),
                totalViews: safeNumbers(updatedYoutubeViews) + safeNumbers(views),
              },
            }
          );

          // changed 5:
          uploadStatus.dataToUpload -= 1;
        }

        // changes 6:
        uploadStatus.isUploading = false;

        fs.unlinkSync(filePath); // delete temp file

        // ✅ Final response (only one response should be sent)
        return res.status(200).json({
          success: true,
          message: `${filteredRows.length} new records saved. ${results.length - filteredRows.length} duplicates ignored.`,
        });
      });
  } catch (error) {
    fs.unlinkSync(filePath);

    // changes7:
    uploadStatus.isUploading = false;
    uploadStatus.dataToUpload = 0;

    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAlldata = async (req, res) => {
  try {
    const result = await VideoStat.deleteMany({});
    return res.status(200).json({
      success: true,
      message: ` ${result.deletedCount} video recourd deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: ` failed to delete recourds: ${error.message} `,
    });
  }
};
