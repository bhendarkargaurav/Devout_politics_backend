import mongoose from "mongoose";

const videoStatSchema = new mongoose.Schema({
  youtubelink: {
    type: String,
    trim: true,
  },
  facebooklink: {
    type: String,
    trim: true,
  },
  youtubeViews: {
    type: Number,
    default: 0,
  },
  youtubeLikes: {
    type: Number,
    default: 0,
  },
  youtubeComments: {
    type: Number,
    default: 0,
  },
  facebookViews: {
    type: Number,
    default: 0,
  },
  facebookLikes: {
    type: Number,
    default: 0,
  },
  facebookComments: {
    type: Number,
    default: 0,
  },

  totalViews: {
    type: Number,
    default: 0,
  },
  youtubechannel: {
    type: String,
    default: "Unknown",
  },
  facebookchannel: {
    type: String,
    default: "Unknown",
  },
  portallink: {
    type: String,
    trim: true,
  },
  portalchannel: {
    type: String,
    default: "Unknown",
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
}, {timestamp: true});

export default mongoose.model("VideoStat", videoStatSchema);
