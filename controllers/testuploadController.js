// update views of previoud links and add channel in database
import fs from "fs";
import csv from "csv-parser";
import VideoStat from "../model/urlmodel.js";
import {
  getYoutubeViews,
  getFacebookViews,
} from "../utils/testapiiFetchers.js";
import uploadStatus from "../middleware/uploadStatusMiddleware.js";
import { count } from "console";


export const testuploadCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];

  const { date } = req.body;

  const uploadDate = date || new Date().toISOString().split("T")[0];

  res.status(200).json({
    success: true,
    message: "File uploaded successfully. Processing in background.",
  });

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
            uploadDate: uploadDate,
          });

          uploadStatus.dataToUpload -= 1;
        }

// from here imporation

        // changes4:-count old records    imp to update previus one data...
        // uploadStatus.dataToUpload = await VideoStat.countDocuments({
        //   uploadDate: { $lt: uploadDate },
        // });

        // const oldRecords = await VideoStat.find({ uploadDate: { $lt: uploadDate } }); // fetch old records

        // for (const record of oldRecords) {
        //   const {
        //     youtubeViews: updatedYoutubeViews,
        //     youtubeLikes: updatedYoutubeLikes,
        //     youtubeComments: updatedYoutubeComments,
        //   } = await getYoutubeViews(record.youtubelink);

        //   const { views, likes, comments } = await getFacebookViews(
        //     record.facebooklink
        //   );

        //   const safeNumbers = (num) => (Number.isFinite(num) ? num : 0);
        //   await VideoStat.updateOne(
        //     { _id: record._id },
        //     {
        //       $set: {
        //         youtubeViews: safeNumbers(updatedYoutubeViews),
        //         youtubeLikes: safeNumbers(updatedYoutubeLikes),
        //         youtubeComments: safeNumbers(updatedYoutubeComments),
        //         facebookViews: safeNumbers(views),
        //         facebookLikes: safeNumbers(likes),
        //         facebookComments: safeNumbers(comments),
        //         totalViews:
        //           safeNumbers(updatedYoutubeViews) + safeNumbers(views),
        //       },
        //     }
        //   );
        //   uploadStatus.dataToUpload -= 1;
        // }
        
        // till here imp code for update previous one

        uploadStatus.isUploading = false;

        fs.unlinkSync(filePath); 

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


// made changes removed async await from getaall


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
      } else if (platform.toLowerCase() === "portal"){
        projection = { portallink: 1, portalchannel: 1, _id: 0};
        filter = { portallink: { $ne: "" } };
      }else {
        return res.status(400).json({
          success: false,
          message: "Platform must be either 'youtube', 'facebook' or portal.",
        });
      }
    } else {
      projection = {
        youtubelink: 1,
        youtubechannel: 1,
        facebooklink: 1,
        facebookchannel: 1,
        portallink: 1,
        portalchannel: 1,
        _id: 0,
      };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // const links = await VideoStat.find(filter, projection) //await
    //   .skip(skip)
    //   .limit(limitNumber)
    //   .lean();
    // const totalCount = await VideoStat.countDocuments(filter); //await 

     const [links, totalCount] = await Promise.all([
      VideoStat.find(filter, projection).skip(skip).limit(limitNumber).lean(),
      VideoStat.countDocuments(filter),
    ]);

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

// export const getYoutubeChannel = async (req, res) => {
//   try {
//     const youtubeChannelCounts = await VideoStat.aggregate([
//       { $match: { youtubechannel: { $ne: "Unknown" } } },
//       { $group: { _id: "$youtubechannel", count: { $sum: 1 } } },
//       { $sort: { count: -1 } },
//     ]);

//     res.status(200).json({
//       success: true,
//       youtubeChannelCounts,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching Youtube channel counts",
//       error: error.message,
//     });
//   }
// };


export const getYoutubeChannel = async(req, res) => {
  try {
    const youtubeChannelCount = await VideoStat.aggregate([
      { $match: { youtubechannel: { $ne: "Unknown" } } },
      {
        $group: {
          _id: {
            $replaceAll:{
              input: { $toLower: "$youtubechannel" },
              find: " ",
              replacement: ""
            }
          },
           originalName: { $first: "$youtubechannel" }, // Keep original name for display
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      youtubeChannelCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching YouTube channel counts",
      error: error.message,
    });
  }
}




export const getYoutubeChannelData = async (req, res) => {
  try {
    const { channelName, page = 1, limit = 20 } = req.query;

    if(!channelName) {
      return res.status(400).json({ success: false, message: "Channel name is required"});
    }

    const skip = (page - 1) * limit;

    // remove space and convert to lowercase
    const cleanedChannelName = channelName.toLowerCase().replace(/\s/g, '');

    //find matching yt channel
    const channelData = await VideoStat.find({
      $expr: {
        $eq: [
          { $replaceAll: 
            { input: { $toLower: "$youtubechannel" }, find: " ", replacement: ""} },
            cleanedChannelName
        ]
      }
    })
    .select('youtubechannel youtubelink youtubeViews youtubeLikes youtubeComments uploadDate _id')
    .skip(skip)
    .limit(Number(limit))
    .lean();

    const totalCount = await VideoStat.countDocuments({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toLower: "$youtubechannel" }, find: " ", replacement: "" } },
          cleanedChannelName
        ]
      }
    });

    return res.status(200).json({
      success: true,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      data: channelData,
    })
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Error fetching YouTube channel data",
      error: error.message,
    });
  }
};

// export const getYoutubeChannelData = async (req, res) => {
//   try {
//     const { channelName, page = 1, limit = 20 } = req.query;

//     if (!channelName) {
//       return res.status(400).json({ success: false, message: "Channel name is required" });
//     }

//     const skip = (page - 1) * limit;

//     // Query to get only youtubelink and youtubeViews
//     const channelData = await VideoStat.find({ youtubechannel: channelName })
//       .select('youtubechannel youtubelink youtubeViews youtubeLikes youtubeComments uploadDate -_id') // Only these fields, excluding _id
//       .skip(skip)
//       .limit(Number(limit))
//       .lean();

//     // Get total count for pagination
//     const totalCount = await VideoStat.countDocuments({ youtubechannel: channelName });

//     res.status(200).json({
//       success: true,
//       currentPage: Number(page),
//       totalPages: Math.ceil(totalCount / limit),
//       totalCount,
//       data: channelData,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching channel data",
//       error: error.message,
//     });
//   }
// };


export const getFacebookChannel = async (req, res) => {
  try {
    const facebookChannelCount = await VideoStat.aggregate([
      { $match: { facebookchannel: { $ne: "Unknown" } } },
      { 
        $group: { 
          _id: { 
            //lowercase and remove all spaces
            $replaceAll: { 
              input: { $toLower: "$facebookchannel" }, 
              find: " ", 
              replacement: "" 
            }
          },
          originalName: { $first: "$facebookchannel" }, 
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }, // Sort by highest count
    ]);

    res.status(200).json({
      success: true,
      facebookChannelCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching Facebook channel counts",
      error: error.message,
    });
  }
};





// get the facebookchanneldata
export const getFacebookChannelData = async (req, res) => {
  try {
    const { channelName, page = 1, limit = 20 } = req.query;

    if (!channelName) {
      return res.status(400).json({ success: false, message: "Channel name is required" });
    }

    const skip = (page - 1) * limit;

    // remove spaces and convert to lowercase
    const cleanedChannelName = channelName.toLowerCase().replace(/\s/g, '');

    // Find matching channels (case and space insensitive)
    const channelData = await VideoStat.find({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toLower: "$facebookchannel" }, find: " ", replacement: "" } },
          cleanedChannelName
        ]
      }
    })
      .select('facebookchannel facebooklink facebookViews facebookLikes facebookComments uploadDate _id')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Count total documents (matching same normalized name)
    const totalCount = await VideoStat.countDocuments({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toLower: "$facebookchannel" }, find: " ", replacement: "" } },
          cleanedChannelName
        ]
      }
    });

    return res.status(200).json({
      success: true,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      data: channelData,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching channel data",
      error: error.message,
    });
  }
};


export const getPortalchannel = async (req, res) => {
  try {
    const portalChannelCount = await VideoStat.aggregate([
      { $match: { portalchannel: { $ne: "Unknown" } } },
      {
        $group: {
          _id: {
            // Lowercase and remove all spaces
            $replaceAll: {
              input: { $toLower: "$portalchannel" },
              find: " ",
              replacement: ""
            }
          },
          originalName: { $first: "$portalchannel" }, // Keep original name for display
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }, // Sort by highest count
    ]);

    res.status(200).json({
      success: true,
      portalChannelCount ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching Portal channel counts",
      error: error.message,
    });
  }
};


export const getportalData = async (req, res) => {
  try {
    const { channelName, page = 1, limit = 20} = req.query;
    
    if(!channelName) {
      return res.status(400).json({success: false, message: "Channel name i srequired"});
    }
    // console.log("channel name is", channelName);
    const skip = (page - 1) * limit;

    const portalData = await VideoStat.find({ portalchannel: { $regex: `^${channelName}$`, $options: 'i' }})
    .select('portalchannel portallink uploadDate _id')
    .skip(skip)
    .limit(Number(limit))
    .lean()

    const totalCount = await VideoStat.countDocuments({ portalchannel: { $regex: `^${channelName}$`, $options: 'i' }});

    return res.status(200).json({
      success: true,
      currentPage: (Number(page)),
      totalPages: (totalCount / limit),
      totalCount,
      data: portalData
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching channel data",
      error: error.message,
    })
  }
}