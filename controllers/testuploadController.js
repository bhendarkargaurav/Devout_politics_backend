// update views of previoud links and add channel in database
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import {
  getYoutubeViews,
  getFacebookViews,
} from "../utils/testapiiFetchers.js";
import uploadStatus from "../middleware/uploadStatusMiddleware.js";

export const testuploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

  // res.status(200).json({
  //   success: true,
  //   message: "File uploaded successfully. Processing in background.",
  // });

  try {
    //changes1:-
    uploadStatus.isUploading = true;
    uploadStatus.dataToUpload = 0;

    // Step 1: Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        const existingLinks = await VideoStat.find(
          {},
          "youtubelink facebooklink"
        );

        const existingSet = new Set(
          existingLinks.map((doc) => `${doc.youtubelink}-${doc.facebooklink}`)
        );

        const filteredRows = results.filter((row) => {
          const key = `${row.youtubelink}-${row.facebooklink}`;
          return !existingSet.has(key); // Only keep unique (new) rows
        });

        //find total data to upload
        uploadStatus.dataToUpload = filteredRows.length;

        // Step 3: Upload only non-duplicate data
        for (const row of filteredRows) {
          const { youtubeViews, youtubeLikes, youtubeComments } =
            await getYoutubeViews(row.youtubelink);

          const facebookViews = await getFacebookViews(row.facebooklink);
          const { views, likes, comments } = facebookViews;

          const safeNumber = (num) => (Number.isFinite(num) ? num : 0);

          await VideoStat.create({
            youtubelink: row.youtubelink,
            facebooklink: row.facebooklink,
            portallink: row.portallink,
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

          uploadStatus.dataToUpload -= 1;
        }

        //changes4:-count old records
        uploadStatus.dataToUpload = await VideoStat.countDocuments({
          uploadDate: { $lt: today },
        });

        const oldRecords = await VideoStat.find({ uploadDate: { $lt: today } }); // fetch old records

        for (const record of oldRecords) {
          const {
            youtubeViews: updatedYoutubeViews,
            youtubeLikes: updatedYoutubeLikes,
            youtubeComments: updatedYoutubeComments,
          } = await getYoutubeViews(record.youtubelink);

          const { views, likes, comments } = await getFacebookViews(
            record.facebooklink
          );

          // const updatedTotalViews = (Number.isFinite(updatedYoutubeViews) ? updatedYoutubeViews : 0) +
          // (Number.isFinite(updatedFacebookViews) ? updatedFacebookViews : 0)
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
                totalViews:
                  safeNumbers(updatedYoutubeViews) + safeNumbers(views),
              },
            }
          );
          uploadStatus.dataToUpload -= 1;
        }
        //chanes 6
        uploadStatus.isUploading = false;

        fs.unlinkSync(filePath); // delete temp file

        // return res.status(200).json({
        //   success: true,
        //   message: `${filteredRows.length} new records saved. ${
        //     results.length - filteredRows.length
        //   } duplicates ignored.`,
        // });
      });
  } catch (error) {
    fs.unlinkSync(filePath);
    uploadStatus.isUploading = false;
    uploadStatus.dataToUpload = 0;
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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





export const getAllLinks = async (req, res) => {
  try {
    const { platform, page = 1, limit = 10 } = req.query;

    let projection = {};
    let filter = {};

    if (platform) {
      if (platform.toLowerCase() === "youtube") {
        projection = { youtubelink: 1, youtubechannel: 1, _id: 0 };
        filter = { youtubelink: { $ne: "" } };
      } else if (platform.toLowerCase() === "facebook") {
        projection = { facebooklink: 1, facebookchannel: 1, _id: 0 };
        filter = { facebooklink: { $ne: "" } };
      } else {
        return res.status(400).json({
          success: false,
          message: "Platform must be either 'youtube' or 'facebook'.",
        });
      }
    } else {
      projection = {
        youtubelink: 1,
        youtubechannel: 1,
        facebooklink: 1,
        facebookchannel: 1,
        _id: 0,
      };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const links = await VideoStat.find(filter, projection)
      .skip(skip)
      .limit(limitNumber)
      .lean();
    const totalCount = await VideoStat.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / limitNumber),
      links,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching links",
      error: error.message,
    });
  }
};

export const getYoutubeChannel = async (req, res) => {
  try {
    const youtubeChannelCounts = await VideoStat.aggregate([
      { $match: { youtubechannel: { $ne: "Unknown" } } },
      { $group: { _id: "$youtubechannel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      youtubeChannelCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching Youtube channel counts",
      error: error.message,
    });
  }
};

export const getFacebookChannel = async (req, res) => {
  try {
    const facebookChannelCount = await VideoStat.aggregate([
      { $match: { facebookchannel: { $ne: "Unknown" } } },
      { $group: { _id: "$facebookchannel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      facebookChannelCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching Facebook channel count",
      error: error.message,
    });
  }
};
