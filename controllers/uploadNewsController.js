// controllers/newsController.js
import News from "../model/newsDatamodel.js";
import cloudinary from "../middleware/cloudinaryMiddleware.js";

export const uploadNewsData = async (req, res) => {
  try {
    const { newspaperName, city, type, uploadDate } = req.body;

    if (!newspaperName || !city || !type) {
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
