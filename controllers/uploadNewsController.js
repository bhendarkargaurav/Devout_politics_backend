// controllers/newsController.js
import News from "../model/newsDatamodel.js";
import cloudinary from "../middleware/cloudinaryMiddleware.js";
import { exportToCSV, exportToPDF } from "../utils/newsdataexport.js";

export const uploadNewsData = async (req, res) => {
  try {
    const { newspaperName, city, type, uploadDate } = req.body;

    if (!newspaperName || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let imageUploads = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "news_uploads",
        });
        imageUploads.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      }
    }

    const news = new News({
      newspaperName,
      city,
      type,
      uploadDate: uploadDate || Date.now(),
      images: imageUploads,
    });

    await news.save();

    res.status(201).json({
      success: true,
      message: "News uploaded successfully",
      data: news,
    });
  } catch (error) {
    console.error("Upload News Error:", error);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
    });
  }
};

export const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




// multiple filters- getnews datafilter

export const getFilteredNews = async (req, res) => {
  try {
    const { newspaperName, type, uploadDate, format } = req.query;

    const filter = {};

    if (uploadDate) {
      const date = new Date(uploadDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      filter.uploadDate = { $gte: date, $lt: nextDay };
    }

    if (type) filter.type = type;
    if (newspaperName) filter.newspaperName = newspaperName;

    const newsData = await News.find(filter).sort({ uploadDate: -1 });

    if (format === "csv") {
      return exportToCSV(res, newsData, "filtered_news.csv");
    }

    if (format === "pdf") {
      return exportToPDF(res, newsData, "filtered_news.pdf");
    }

    // Default: return JSON response
    res.status(200).json({
      success: true,
      count: newsData.length,
      data: newsData,
    });
  } catch (error) {
    console.error("Error fetching news data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
