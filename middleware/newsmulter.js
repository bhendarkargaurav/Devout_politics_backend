// middlewares/multer.js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    cb(new Error("Only JPG, JPEG, PNG files are allowed"), false);
    return;
  }
  cb(null, true);
};

const uploadnews = multer({ storage, fileFilter });

export default uploadnews;