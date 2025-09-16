// models/News.js
import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    newspaperName: {
      type: String,
      required: true,
      trim: true,
    },
    pageNumber: {
      type: String,
    },
    city: {
      type: String,
    //   required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Positive", "Negative", "Crime", "Add", "All party"], // can be extended dynamically
      default: "other",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);
export default News;
