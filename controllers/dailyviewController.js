import DailyViews from "../model/dailyviewmodel.js";
 // find all dat afrom past also filter based on date and links
 
export const getDailyViews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.youtubelink) filter.youtubelink = req.query.youtubelink;
    if (req.query.facebooklink) filter.facebooklink = req.query.facebooklink;

    const data = await DailyViews.find(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



