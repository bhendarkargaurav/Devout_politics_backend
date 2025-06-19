import mongoose from "mongoose";

const videoStatSchema = new mongoose.Schema({
  youtubelink: String,
  facebooklink: String,
  youtubeViews: Number,
  facebookViews: Number,
  totalViews: Number,
  youtubechannel: String,   
  facebookchannel: String,
  uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model("VideoStat", videoStatSchema);
