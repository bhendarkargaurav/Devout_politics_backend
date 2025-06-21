// update views of previoud links and add channel in database
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import {
  getYoutubeViews,
  getFacebookViews,
} from "../utils/testapiiFetchers.js";

export const testuploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

  // res.status(200).json({
  //   success: true,
  //   message: "File uploaded successfully",
  // });

  try {
    // Step 1: Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        // Step 2: Get all existing links
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

        // Step 3: Upload only non-duplicate data
        for (const row of filteredRows) {
          const { youtubeViews, youtubeLikes, youtubeComments } =
            await getYoutubeViews(row.youtubelink);

          const facebookViews = await getFacebookViews(row.facebooklink);
          const totalViews =
            (Number.isFinite(youtubeViews) ? youtubeViews : 0) +
            (Number.isFinite(facebookViews) ? facebookViews : 0);

          const safeNumber = (num) => (Number.isFinite(num) ? num : 0);
          // await VideoStat.create({
          //   youtubelink: row.youtubelink,
          //   facebooklink: row.facebooklink,
          //   youtubeViews,
          //   youtubeLikes,
          //   youtubeComments,
          //   facebookViews,
          //   totalViews,
          //   uploadDate: today,
          //   youtubechannel: row.youtubechannel || "Unknown",
          //   facebookchannel: row.facebookchannel || "Unknown",
          // });

          await VideoStat.create({
            youtubelink: row.youtubelink,
            facebooklink: row.facebooklink,
            youtubeViews: safeNumber(youtubeViews),
            youtubeLikes: safeNumber(youtubeLikes),
            youtubeComments: safeNumber(youtubeComments),
            facebookViews: safeNumber(facebookViews),
            totalViews: safeNumber(youtubeViews) + safeNumber(facebookViews),
            uploadDate: today,
            youtubechannel: row.youtubechannel || "Unknown",
            facebookchannel: row.facebookchannel || "Unknown",
          });
        }

        //  Update view counts for old records (uploaded before today)
        const oldRecords = await VideoStat.find({ uploadDate: { $lt: today } });

        for (const record of oldRecords) {
          // const updatedYoutubeViews = await getYoutubeViews(record.youtubelink);
          const {
            youtubeViews: updatedYoutubeViews,
            youtubeLikes: updatedYoutubeLikes,
            youtubeComments: updatedYoutubeComments,
          } = await getYoutubeViews(record.youtubelink);

          const updatedFacebookViews = await getFacebookViews(
            record.facebooklink
          );
          const updatedTotalViews = updatedYoutubeViews + updatedFacebookViews;
          // const updatedTotalViews = (Number.isFinite(updatedYoutubeViews) ? updatedYoutubeViews : 0) +
          // (Number.isFinite(updatedFacebookViews) ? updatedFacebookViews : 0)

          const safeNumbers = (num) => (Number.isFinite(num) ? num : 0);
          await VideoStat.updateOne(
            { _id: record._id },
            {
              $set: {
                youtubeViews: safeNumbers(updatedYoutubeViews),
                facebookViews: safeNumbers(updatedFacebookViews),
                youtubeLikes: safeNumbers(updatedYoutubeLikes),
                youtubeComments: safeNumbers(updatedYoutubeComments),
                totalViews:
                  safeNumbers(updatedYoutubeViews) +
                  safeNumbers(updatedFacebookViews),
              },
            }
          );
        }

        fs.unlinkSync(filePath); // delete temp file

        return res.status(200).json({
          success: true,
          message: `${filteredRows.length} new records saved. ${
            results.length - filteredRows.length
          } duplicates ignored.`,
        });
      });
  } catch (error) {
    fs.unlinkSync(filePath);
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
