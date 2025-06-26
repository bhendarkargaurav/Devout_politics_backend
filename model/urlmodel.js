// import mongoose from "mongoose";

// const videoStatSchema = new mongoose.Schema({
//   youtubelink: String,
//   facebooklink: String,
//   youtubeViews: Number,
//   youtubeLikes: Number,
//   youtubeComments: Number,
//   facebookViews: Number,
//   totalViews: Number,
//   youtubechannel: String,   
//   facebookchannel: String,
//   uploadDate: { type: Date, default: Date.now }
// });

// export default mongoose.model("VideoStat", videoStatSchema);



import mongoose from "mongoose";

const videoStatSchema = new mongoose.Schema({
  youtubelink: {
    type: String,
    required: true,
    trim: true,
  },
  facebooklink: {
    type: String,
    required: true,
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
  facebookComments:{
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
    required: true,
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
});

export default mongoose.model("VideoStat", videoStatSchema);
