// import fs from "fs";
// import csv from "csv-parser";
// import VideoStat from "../model/urlmodel.js";
// import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

// export const uploadCSV = async (req, res) => {
//   const filePath = req.file.path;
//   const results = [];
//   const today = new Date().toISOString().split("T")[0];

//   fs.createReadStream(filePath)
//     .pipe(csv())
//     .on("data", (row) => results.push(row))
//     .on("end", async () => {
//       for (const row of results) {
//         const youtubeViews = await getYoutubeViews(row.youtubelink);
//         const facebookViews = await getFacebookViews(row.facebooklink);
//         const totalViews = youtubeViews + facebookViews;

//         await VideoStat.create({
//           youtubelink: row.youtubelink,
//           facebooklink: row.facebooklink,
//           youtubeViews,
//           facebookViews,
//           totalViews,
//           uploadDate: today
//         });
//       }

//       fs.unlinkSync(filePath); // delete temp file
//       res.json({ success: true, message: "CSV uploaded and view data saved." });
//     });
// };

// export const getStats = async (req, res) => {
//   try {
//     const data = await VideoStat.find().sort({ uploadDate: -1 });
//     res.json({ success: true, data });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error fetching stats." });
//   }
// };




// // Get all youtubelinks & facebooklink
// export const getAllLinks = async (req, res) => {
//   try {
//     const { youtubelink, facebooklink } = req.query;

//     // Create dynamic filter
//     const filter = {};
//     if (youtubelink) filter.youtubelink = youtubelink;
//     if (facebooklink) filter.facebooklink = facebooklink;

//     const data = await VideoStat.find(filter).select("youtubelink facebooklink -_id");

//     res.status(200).json({
//       success: true,
//       count: data.length,
//       links: data
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error fetching links", error: err.message });
//   }
// };









// new one
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

export const uploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

  try {
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

        // Step 3: Upload only non-duplicate data
        for (const row of filteredRows) {
          const youtubeViews = await getYoutubeViews(row.youtubelink);
          const facebookViews = await getFacebookViews(row.facebooklink);
          const totalViews = youtubeViews + facebookViews;


          //new line add after success run
          // let channelName = "Unknown";
          // if (videoData.owner_name) {
          //   const match = videoData.owner_name.match(/\| By (.+)$/);
          //   channelName = match ? match[1].trim() : videoData.owner_name;
          // }


          await VideoStat.create({
            youtubelink: row.youtubelink,
            facebooklink: row.facebooklink,
            youtubeViews,
            facebookViews,
            totalViews,
            uploadDate: today,
            // facebookChannel: channelName   //new
          });
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
    fs.unlinkSync(filePath); // cleanup even on error
    return res.status(500).json({ success: false, message: error.message });
  }
};





export const deleteAlldata = async (req, res) => {
  try {
    const result = await VideoStat.deleteMany({});
    return res.status(200).json({
      success: true,
      message:  ` ${result.deletedCount} video recourd deleted successfully`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:  ` failed to delete recourds: ${error.message} `,
    });
  };
};