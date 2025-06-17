import mongoose from "mongoose";

const dailyViewsSchema = new mongoose.Schema({
  youtubelink: String,
  facebooklink: String,
  youtubeViews: Number,
  facebookViews: Number,
  totalViews: Number,
  date: String
});

const DailyViews = mongoose.model("DailyViews", dailyViewsSchema);
export default DailyViews;

