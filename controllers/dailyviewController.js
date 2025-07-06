
// import VideoStat from "../model/urlmodel.js"
 
// export const getDailyViews = async (req, res) => {
//   try {
//     const filter = {}; //dynamic filtering 
    
//     if (req.query.youtubelink) filter.youtubelink = req.query.youtubelink;
//     if (req.query.facebooklink) filter.facebooklink = req.query.facebooklink;
//     if (req.query.uploadDate) filter.uploadDate = req.query.uploadDate;

//     const data = await VideoStat.find(filter);//.sort({ createdAt: -1 })
//     res.status(200)
//     .json({ 
//       success: true,
//       data 
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


import VideoStat from "../model/urlmodel.js"

export const getDailyViews = async (req, res) => {
  try {

    const filter = {};
    const {page = 1, limit = 10} = req.query;
  
    const { youtubelink, facebooklink, initialDate, endDate, uploadDates, uploadDate } = req.query;
  
    if(youtubelink) filter.youtubelink = youtubelink;
    if(facebooklink) filter.facebooklink = facebooklink;

    const skip = (page - 1) * limit;
  
    // for Date Range Filter
    if(initialDate && endDate) {
      filter.uploadDate = {
        $gte: new Date(initialDate),
        $lte: new Date(endDate)
      };
    } 
    // multiple specific date filter
    else if(uploadDates) {
      const datesArray = uploadDates.split(',').map(date => new Date(date.trim()));
      filter.uploadDate = { $in: datesArray };
    } 
    
    else if(uploadDate) {
      filter.uploadDate = new Date(uploadDate);
    }
  
    const data = await VideoStat.find(filter).sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

    const totalCount = await VideoStat.countDocuments(filter);
  
    res.status(200).json({
      success: true,
      currentPage: (Number(page)),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
       error: error.message 
    })
  }
};