
import VideoStat from "../model/urlmodel.js";

export const getDailyViews = async (req, res) => {
  try {
    const filter = {};
    // const {page = 1, limit = 10} = req.query;

    const {
      youtubelink,
      facebooklink,
      initialDate,
      endDate,
      uploadDates,
      uploadDate,
    } = req.query;

    if (youtubelink) filter.youtubelink = youtubelink;
    if (facebooklink) filter.facebooklink = facebooklink;

    // const skip = (page - 1) * limit;

    // for Date Range Filter
    if (initialDate && endDate) {
      filter.uploadDate = {
        $gte: new Date(initialDate),
        $lte: new Date(endDate),
      };
    }
    // multiple specific date filter
    else if (uploadDates) {
      const datesArray = uploadDates
        .split(",")
        .map((date) => new Date(date.trim()));
      filter.uploadDate = { $in: datesArray };
    } else if (uploadDate) {
      filter.uploadDate = new Date(uploadDate);
    }

    const data = await VideoStat.find(filter).sort({ createdAt: -1 });
    // .skip(skip)
    // .limit(Number(limit))
    // .lean()

    // const totalCount = await VideoStat.countDocuments(filter);

    res.status(200).json({
      success: true,
      // currentPage: (Number(page)),
      // totalPages: Math.ceil(totalCount / limit),
      // totalCount,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//updated one to show all yt data on dashboard with pagination
export const getAllYoutubeData = async (req, res) => {
  try {

    const { page = 1, limit = 5 } = req.query;

    const skip = ( page - 1 ) * limit;

     const filter = { youtubelink: { $exists: true, $ne: "" } };  // filter only documents having YouTube link

    const youtubeData = await VideoStat.find(
      filter, 
      {
        youtubelink: 1,
        youtubeViews: 1,
        youtubeLikes: 1,
        youtubeComments: 1,
        youtubechannel: 1,
        uploadDate: 1,
        _id: 0, // optional: hide _id
      })
    .skip(skip)
    .limit(Number(limit))
    .lean();

    const totalCount = await VideoStat.countDocuments(filter);

    res.status(200).json({
      success: true,
      currentPage: (Number(page)),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      youtubeData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




//to show all fb data on dashboard with pagination
export const getAllFacebookData = async (req, res) => {
  try {
    
    const { page = 1, limit = 5 } = req.query;
    const skip = ( page - 1 ) * limit;

    const filter = { facebooklink: { $exists: true, $ne: "" } };

    const facebookData = await VideoStat.find(
      filter,
      {
        facebooklink: 1,
        facebookViews: 1,
        facebookLikes: 1,
        facebookComments: 1,
        facebookchannel: 1,
        uploadDate: 1,
        _id: 0,
      })
      .lean()
      .skip(skip)
      .limit(Number(limit))

      const totalCount = await VideoStat.countDocuments(filter);

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      facebookData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}



//to show all portal data on dashboard with pagination
export const getAllPortalData = async(req, res) => {
  try {
    
    const filter = { portallink: { $exists: true, $ne: ""  }};

    const { page = 1, limit = 5 } = req.query;
    const skip = ( page -1 ) * limit;

    const portalData = await VideoStat.find(
      filter,
      {
        portallink: 1,
        portalchannel: 1,
        uploadDate: 1,
        _id: 0,
      })
      .lean()
      .skip(skip)
      .limit(Number(limit))

      const totalCount = await VideoStat.countDocuments(filter);
      
    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil( totalCount / limit ),
      totalCount,
      portalData
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}





// get all data with multiple filter
export const getAllDataWithFilters = async (req, res) => {
  try {
    const {
      youtubelink,
      facebooklink,
      initialDate,
      endDate,
      uploadDates,
      uploadDate,
      ytchannelName,
      fbchannelName,
    } = req.query;

    //initializes MongoDB match expression using the $and operator, 
    // which is used to combine multiple conditions.

    const matchExpr = { $and: [] };

    // Link filters
    if (youtubelink) {
      matchExpr.$and.push({ youtubelink });
    }
    if (facebooklink) {
      matchExpr.$and.push({ facebooklink });
    }

    // Date filters
    if (initialDate && endDate) {
      matchExpr.$and.push({
        uploadDate: {
          $gte: new Date(initialDate),
          $lte: new Date(endDate),
        },
      });
    } else if (uploadDates) {
      const datesArray = Array.isArray(uploadDates)
        ? uploadDates
        : uploadDates.split(",");
      matchExpr.$and.push({
        uploadDate: {
          $in: datesArray.map((date) => new Date(date.trim())),
        },
      });
    } else if (uploadDate) {
      matchExpr.$and.push({
        uploadDate: new Date(uploadDate),
      });
    }

    // YouTube channel filter (case-insensitive + space-insensitive)
    if (ytchannelName) {
      const ytArray = Array.isArray(ytchannelName)
        ? ytchannelName
        : ytchannelName.split(",");
      const cleanedYtChannels = ytArray.map((name) =>
        name.trim().toLowerCase().replace(/\s/g, "")
      );
      matchExpr.$and.push({
        $expr: {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$youtubechannel" },
                find: " ",
                replacement: "",
              },
            },
            cleanedYtChannels,
          ],
        },
      });
    }

    // Facebook channel filter (case-insensitive + space-insensitive)
    if (fbchannelName) {
      const fbArray = Array.isArray(fbchannelName)
        ? fbchannelName
        : fbchannelName.split(",");
      const cleanedFbChannels = fbArray.map((name) =>
        name.trim().toLowerCase().replace(/\s/g, "")
      );
      matchExpr.$and.push({
        $expr: {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$facebookchannel" },
                find: " ",
                replacement: "",
              },
            },
            cleanedFbChannels,
          ],
        },
      });
    }

    // Match all if no filters applied
    if (matchExpr.$and.length === 0) {
      delete matchExpr.$and;
    }

    
  //data accourding to specific filter
    //new change   we have a code its in commented formate: bottom of getalldatawithfilter func.


    // Fetch data and count
    const [data, totalCount] = await Promise.all([
      VideoStat.find(matchExpr).sort({ createdAt: -1 }).lean(), //.select(projection)
      VideoStat.countDocuments(matchExpr),
    ]);

    // Calculate totals
   const totals = data.reduce(
  (acc, item) => {
    acc.totalYoutubeViews += item.youtubeViews || 0;
    acc.totalFacebookViews += item.facebookViews || 0;

    if (item.youtubelink) acc.totalYoutubeLinks += 1;
    if (item.youtubechannel) acc.totalYoutubeChannels += 1;

    if (item.facebooklink) acc.totalFacebookLinks += 1;
    if (item.facebookchannel) acc.totalFacebookChannels += 1;

    return acc;
  },
  {
    totalYoutubeChannels: 0,
    totalYoutubeLinks: 0,
    totalYoutubeViews: 0,
    totalFacebookChannels: 0,
    totalFacebookLinks: 0,
    totalFacebookViews: 0,
  }
);


    return res.status(200).json({
      success: true,
      totalCount,
      totals,
      //filterUsed: matchExpr, : it give what filter you applyied
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching daily views",
      error: error.message,
    });
  }
};

  //data accourding to specific filter
    //new change
    // Determine projection (which fields to return)
// let projection = {}; // default: return all

// const isOnlyYoutubeChannelFilter =
//   ytchannelName &&
//   !fbchannelName &&
//   !uploadDate &&
//   !initialDate &&
//   !endDate &&
//   !uploadDates &&
//   !facebooklink &&
//   !youtubelink;

// const isOnlyFacebookChannelFilter =
//   fbchannelName &&
//   !ytchannelName &&
//   !uploadDate &&
//   !initialDate &&
//   !endDate &&
//   !uploadDates &&
//   !facebooklink &&
//   !youtubelink;

// const isBothYtAndFbChannelFilterOnly =
//   ytchannelName &&
//   fbchannelName &&
//   !uploadDate &&
//   !initialDate &&
//   !endDate &&
//   !uploadDates &&
//   !facebooklink &&
//   !youtubelink;

// if (isBothYtAndFbChannelFilterOnly) {
//   projection = {
//     youtubechannel: 1,
//     youtubelink: 1,
//     youtubeViews: 1,
//     youtubeLikes: 1,
//     youtubeComments: 1,
//     facebookchannel: 1,
//     facebooklink: 1,
//     facebookViews: 1,
//     facebookLikes: 1,
//     facebookComments: 1,
//     uploadDate: 1,
//     createdAt: 1,
//     updatedAt: 1,
//     totalViews: 1,
//   };
// } else if (isOnlyYoutubeChannelFilter) {
//   projection = {
//     youtubechannel: 1,
//     youtubelink: 1,
//     youtubeViews: 1,
//     youtubeLikes: 1,
//     youtubeComments: 1,
//     uploadDate: 1,
//     createdAt: 1,
//     updatedAt: 1,
//     totalViews: 1,
//   };
// } else if (isOnlyFacebookChannelFilter) {
//   projection = {
//     facebookchannel: 1,
//     facebooklink: 1,
//     facebookViews: 1,
//     facebookLikes: 1,
//     facebookComments: 1,
//     uploadDate: 1,
//     createdAt: 1,
//     updatedAt: 1,
//     totalViews: 1,
//   };
// }

// else: both filters or more filters applied → projection remains {}
