
import VideoStat from "../model/urlmodel.js"
 
export const getDailyViews = async (req, res) => {
  try {
    const filter = {}; //dynamic filtering 
    
    if (req.query.uploadDate) filter.uploadDate = req.query.uploadDate;
    if (req.query.youtubelink) filter.youtubelink = req.query.youtubelink;
    if (req.query.facebooklink) filter.facebooklink = req.query.facebooklink;

    const data = await VideoStat.find(filter);
    res.status(200)
    .json({ 
      success: true,
      data 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



