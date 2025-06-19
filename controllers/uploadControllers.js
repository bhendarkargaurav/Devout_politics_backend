// No: 1 perfectly working we did pressentation on this code only
// import fs from "fs";
// import csv from "csv-parser";
// import VideoStat from "../model/urlmodel.js";
// import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

// export const uploadCSV = async (req, res) => {
//   const filePath = req.file.path;
//   const results = [];
//   const today = new Date().toISOString().split("T")[0];

//   try {
//     // Step 1: Parse CSV
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (row) => results.push(row))
//       .on("end", async () => {
//         // Step 2: Get all existing links
//         const existingLinks = await VideoStat.find({}, "youtubelink facebooklink");

//         const existingSet = new Set(
//           existingLinks.map((doc) => `${doc.youtubelink}-${doc.facebooklink}`)
//         );

//         const filteredRows = results.filter((row) => {
//           const key = `${row.youtubelink}-${row.facebooklink}`;
//           return !existingSet.has(key); // Only keep unique (new) rows
//         });

//         // Step 3: Upload only non-duplicate data
//         for (const row of filteredRows) {
//           const youtubeViews = await getYoutubeViews(row.youtubelink);
//           const facebookViews = await getFacebookViews(row.facebooklink);
//           const totalViews = youtubeViews + facebookViews;


//           //new line add after success run
//           // let channelName = "Unknown";
//           // if (videoData.owner_name) {
//           //   const match = videoData.owner_name.match(/\| By (.+)$/);
//           //   channelName = match ? match[1].trim() : videoData.owner_name;
//           // }


//           await VideoStat.create({
//             youtubelink: row.youtubelink,
//             facebooklink: row.facebooklink,
//             youtubeViews,
//             facebookViews,
//             totalViews,
//             uploadDate: today,
//             // facebookChannel: channelName   //new
//           });
//         }

//         fs.unlinkSync(filePath); // delete temp file

//         return res.status(200).json({
//           success: true,
//           message: `${filteredRows.length} new records saved. ${
//             results.length - filteredRows.length
//           } duplicates ignored.`,
//         });
//       });
//   } catch (error) {
//     fs.unlinkSync(filePath); // cleanup even on error
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };






// No. 2 updated code for update the views of privious link.

// // new code snippet do update old views of the data uploaded befor today
// import fs from "fs"; 
// import csv from "csv-parser";
// import VideoStat from "../model/urlmodel.js";
// import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

// export const uploadCSV = async (req, res) => {
//   const filePath = req.file.path;
//   const results = [];
//   const today = new Date().toISOString().split("T")[0];

//   try {
//     // step 1 Parse CSV
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (row) => results.push(row))
//       .on("end", async () => {
//         // Step 2: Get all existing links
//         const existingLinks = await VideoStat.find({}, "youtubelink facebooklink");

//         const existingSet = new Set(
//           existingLinks.map((doc) => `${doc.youtubelink}-${doc.facebooklink}`)
//         );

//         const filteredRows = results.filter((row) => {
//           const key = `${row.youtubelink}-${row.facebooklink}`;
//           return !existingSet.has(key); // Only keep unique (new) rows
//         });

//         // Step 3: Upload only non-duplicate data
//         for (const row of filteredRows) {
//           const youtubeViews = await getYoutubeViews(row.youtubelink);
//           const facebookViews = await getFacebookViews(row.facebooklink);
//           const totalViews = youtubeViews + facebookViews;

//           //new line add after success run
//           // let channelName = "Unknown";
//           // if (videoData.owner_name) {
//           //   const match = videoData.owner_name.match(/\| By (.+)$/);
//           //   channelName = match ? match[1].trim() : videoData.owner_name;
//           // }

//           await VideoStat.create({
//             youtubelink: row.youtubelink,
//             facebooklink: row.facebooklink,
//             youtubeViews,
//             facebookViews,
//             totalViews,
//             uploadDate: today,
//             // facebookChannel: channelName   //new
//           });
//         }

//         // ✅ NEW: Update view counts for old records (uploaded before today)
//         const oldRecords = await VideoStat.find({ uploadDate: { $lt: today } });

//         for (const record of oldRecords) {
//           const updatedYoutubeViews = await getYoutubeViews(record.youtubelink);
//           const updatedFacebookViews = await getFacebookViews(record.facebooklink);
//           const updatedTotalViews = updatedYoutubeViews + updatedFacebookViews;

//           await VideoStat.updateOne(
//             { _id: record._id },
//             {
//               $set: {
//                 youtubeViews: updatedYoutubeViews,
//                 facebookViews: updatedFacebookViews,
//                 totalViews: updatedTotalViews,
//               },
//             }
//           );
//         }

//         fs.unlinkSync(filePath); // delete temp file

//         return res.status(200).json({
//           success: true,
//           message: `${filteredRows.length} new records saved. ${
//             results.length - filteredRows.length
//           } duplicates ignored.`,
//         });
//       });
//   } catch (error) {
//     fs.unlinkSync(filePath); // cleanup even on error
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };





// No.3 update views of previoud link and add channel in database
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import { getYoutubeViews, getFacebookViews } from "../utils/apiFetchers.js";

export const uploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const today = new Date().toISOString().split("T")[0];

   // Immediately respond to frontend bcz it take time to upload
  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
  });

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

          await VideoStat.create({
            youtubelink: row.youtubelink,
            facebooklink: row.facebooklink,
            youtubeViews,
            facebookViews,
            totalViews,
            uploadDate: today,
            youtubechannel: row.youtubechannel || "Unknown",
            facebookchannel: row.facebookchannel || "Unknown",
          });
        }

        // ✅ NEW: Update view counts for old records (uploaded before today)
        const oldRecords = await VideoStat.find({ uploadDate: { $lt: today } });

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