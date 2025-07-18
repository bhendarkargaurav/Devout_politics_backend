
import VideoStat from "../model/urlmodel.js";
import { exportToCSV } from "../utils/exportToCSV.js";
import { exportToPDF } from "../utils/exportToPDF.js";


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





// get all data with multiple filter not as company want (Not in Work)
export const getAllDataWithFilter = async (req, res) => {
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

// get all data with filter as company WakeLockSentinel (Not in Work)
export const abcgetAllDataWithFilters = async (req, res) => {
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

    // Date filter
    const dateFilter = {};
    if (initialDate && endDate) {
      dateFilter.uploadDate = {
        $gte: new Date(initialDate),
        $lte: new Date(endDate),
      };
    } else if (uploadDates) {
      const datesArray = Array.isArray(uploadDates)
        ? uploadDates
        : uploadDates.split(",");
      dateFilter.uploadDate = {
        $in: datesArray.map((date) => new Date(date.trim())),
      };
    } else if (uploadDate) {
      dateFilter.uploadDate = new Date(uploadDate);
    }

    const normalize = (str) => str.toLowerCase().replace(/\s/g, "");

    // ----------------------------
    // Build YouTube filter logic
    // ----------------------------
    let ytMatchExpr = null;
    if (ytchannelName || youtubelink || Object.keys(dateFilter).length) {
      ytMatchExpr = { ...dateFilter };

      if (ytchannelName) {
        const ytArray = Array.isArray(ytchannelName)
          ? ytchannelName
          : ytchannelName.split(",");
        ytMatchExpr.$expr = {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$youtubechannel" },
                find: " ",
                replacement: "",
              },
            },
            ytArray.map(normalize),
          ],
        };
      }

      if (youtubelink) {
        ytMatchExpr.youtubelink = youtubelink;
      }
    }

    // ----------------------------
    // Build Facebook filter logic
    // ----------------------------
    let fbMatchExpr = null;
    if (fbchannelName || facebooklink || Object.keys(dateFilter).length) {
      fbMatchExpr = { ...dateFilter };

      if (fbchannelName) {
        const fbArray = Array.isArray(fbchannelName)
          ? fbchannelName
          : fbchannelName.split(",");
        fbMatchExpr.$expr = {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$facebookchannel" },
                find: " ",
                replacement: "",
              },
            },
            fbArray.map(normalize),
          ],
        };
      }

      if (facebooklink) {
        fbMatchExpr.facebooklink = facebooklink;
      }
    }

    // ----------------------------
    // Determine filter intent
    // ----------------------------
    const onlyYtFilter = ytchannelName || youtubelink;
    const onlyFbFilter = fbchannelName || facebooklink;

    let ytData = [];
    let fbData = [];

    if (onlyYtFilter && !onlyFbFilter) {
      ytData = await VideoStat.find(ytMatchExpr || {}).lean();
    } else if (onlyFbFilter && !onlyYtFilter) {
      fbData = await VideoStat.find(fbMatchExpr || {}).lean();
    } else if (!onlyYtFilter && !onlyFbFilter && Object.keys(dateFilter).length) {
      // Only date filter
      ytData = await VideoStat.find(dateFilter).lean();
      fbData = await VideoStat.find(dateFilter).lean();
    } else if (!onlyYtFilter && !onlyFbFilter) {
      // No filters at all
      ytData = await VideoStat.find({}).lean();
      fbData = await VideoStat.find({}).lean();
    } else {
      // If both yt and fb filters are applied (rare case)
      ytData = await VideoStat.find(ytMatchExpr || {}).lean();
      fbData = await VideoStat.find(fbMatchExpr || {}).lean();
    }

    // ----------------------------
    // YouTube totals
    // ----------------------------
    const ytTotals = ytData.reduce(
      (acc, item) => {
        acc.totalYoutubeViews += item.youtubeViews || 0;
        if (item.youtubelink) acc.totalYoutubeLinks += 1;
        if (item.youtubechannel) acc.totalYoutubeChannels += 1;
        return acc;
      },
      {
        totalYoutubeViews: 0,
        totalYoutubeLinks: 0,
        totalYoutubeChannels: 0,
      }
    );

    // ----------------------------
    // Facebook totals
    // ----------------------------
    const fbTotals = fbData.reduce(
      (acc, item) => {
        acc.totalFacebookViews += item.facebookViews || 0;
        if (item.facebooklink) acc.totalFacebookLinks += 1;
        if (item.facebookchannel) acc.totalFacebookChannels += 1;
        return acc;
      },
      {
        totalFacebookViews: 0,
        totalFacebookLinks: 0,
        totalFacebookChannels: 0,
      }
    );

    return res.status(200).json({
      success: true,
      filtersUsed: {
        ytMatchExpr: ytMatchExpr || {},
        fbMatchExpr: fbMatchExpr || {},
      },
      youtube: {
        count: ytData.length,
        totals: ytTotals,
        data: ytData,
      },
      facebook: {
        count: fbData.length,
        totals: fbTotals,
        data: fbData,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: error.message,
    });
  }
};



//get all data -> as company want and export in csv and pdf format (currently working)
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

    // Date filter
    const dateFilter = {};
    if (initialDate && endDate) {
      dateFilter.uploadDate = {
        $gte: new Date(initialDate),
        $lte: new Date(endDate),
      };
    } else if (uploadDates) {
      const datesArray = Array.isArray(uploadDates)
        ? uploadDates
        : uploadDates.split(",");
      dateFilter.uploadDate = {
        $in: datesArray.map((date) => new Date(date.trim())),
      };
    } else if (uploadDate) {
      dateFilter.uploadDate = new Date(uploadDate);
    }

    const normalize = (str) => str.toLowerCase().replace(/\s/g, "");

    // ----------------------------
    // Build YouTube filter logic
    // ----------------------------
    let ytMatchExpr = null;
    if (ytchannelName || youtubelink || Object.keys(dateFilter).length) {
      ytMatchExpr = { ...dateFilter };

      if (ytchannelName) {
        const ytArray = Array.isArray(ytchannelName)
          ? ytchannelName
          : ytchannelName.split(",");
        ytMatchExpr.$expr = {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$youtubechannel" },
                find: " ",
                replacement: "",
              },
            },
            ytArray.map(normalize),
          ],
        };
      }

      if (youtubelink) {
        ytMatchExpr.youtubelink = youtubelink;
      }
    }

    // ----------------------------
    // Build Facebook filter logic
    // ----------------------------
    let fbMatchExpr = null;
    if (fbchannelName || facebooklink || Object.keys(dateFilter).length) {
      fbMatchExpr = { ...dateFilter };

      if (fbchannelName) {
        const fbArray = Array.isArray(fbchannelName)
          ? fbchannelName
          : fbchannelName.split(",");
        fbMatchExpr.$expr = {
          $in: [
            {
              $replaceAll: {
                input: { $toLower: "$facebookchannel" },
                find: " ",
                replacement: "",
              },
            },
            fbArray.map(normalize),
          ],
        };
      }

      if (facebooklink) {
        fbMatchExpr.facebooklink = facebooklink;
      }
    }

    // ----------------------------
    // Determine filter intent
    // ----------------------------
    const onlyYtFilter = ytchannelName || youtubelink;
    const onlyFbFilter = fbchannelName || facebooklink;

    let ytData = [];
    let fbData = [];

    if (onlyYtFilter && !onlyFbFilter) {
      ytData = await VideoStat.find(ytMatchExpr || {}).lean();
    } else if (onlyFbFilter && !onlyYtFilter) {
      fbData = await VideoStat.find(fbMatchExpr || {}).lean();
    } else if (!onlyYtFilter && !onlyFbFilter && Object.keys(dateFilter).length) {
      // Only date filter
      ytData = await VideoStat.find(dateFilter).lean();
      fbData = await VideoStat.find(dateFilter).lean();
    } else if (!onlyYtFilter && !onlyFbFilter) {
      // No filters at all
      ytData = await VideoStat.find({}).lean();
      fbData = await VideoStat.find({}).lean();
    } else {
      // If both yt and fb filters are applied (rare case)
      ytData = await VideoStat.find(ytMatchExpr || {}).lean();
      fbData = await VideoStat.find(fbMatchExpr || {}).lean();
    }

    // ----------------------------
    // YouTube totals
    // ----------------------------
    const ytTotals = ytData.reduce(
      (acc, item) => {
        acc.totalYoutubeViews += item.youtubeViews || 0;
        if (item.youtubelink) acc.totalYoutubeLinks += 1;
        if (item.youtubechannel) acc.totalYoutubeChannels += 1;
        return acc;
      },
      {
        totalYoutubeViews: 0,
        totalYoutubeLinks: 0,
        totalYoutubeChannels: 0,
      }
    );

    // ----------------------------
    // Facebook totals
    // ----------------------------
    const fbTotals = fbData.reduce(
      (acc, item) => {
        acc.totalFacebookViews += item.facebookViews || 0;
        if (item.facebooklink) acc.totalFacebookLinks += 1;
        if (item.facebookchannel) acc.totalFacebookChannels += 1;
        return acc;
      },
      {
        totalFacebookViews: 0,
        totalFacebookLinks: 0,
        totalFacebookChannels: 0,
      }
    );



// Combine filtered data
const combinedData = [...ytData, ...fbData];

// Handle export format
if (req.query.format === "csv") {
  return exportToCSV(res, combinedData, "filtered_data.csv");
}

if (req.query.format === "pdf") {
  return exportToPDF(res, combinedData, "filtered_data.pdf");
}

// Default: return JSON if no format given
return res.status(200).json({
  success: true,
  // filtersUsed: {
  //   ytMatchExpr: ytMatchExpr || {},
  //   fbMatchExpr: fbMatchExpr || {},
  // },
  youtube: {
    count: ytData.length,
    totals: ytTotals,
    data: ytData,
  },
  facebook: {
    count: fbData.length,
    totals: fbTotals,
    data: fbData,
  },
});
} catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: error.message,
    });
  }
};