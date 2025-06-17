import express from "express";
import multer from "multer";
import { uploadCSV,  getAllLinks } from "../controllers/uploadControllers.js";
// import { uploadCSV } from "../controllers/nuploadControllers.js";
import { getDailyViews } from "../controllers/dailyviewController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), uploadCSV);
// router.get("/stats", getStats);
router.get("/links", getAllLinks);
router.get("/daily-views", getDailyViews);

export default router;
