import express from "express";
import multer from "multer";
import { uploadCSV, deleteAlldata } from "../controllers/uploadControllers.js";//getAllLinks
import { getPaginatedVideos, exportAllDataToCSV  } from "../controllers/exportAllDataControllers.js";
import { getDailyViews } from "../controllers/dailyviewController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), uploadCSV);
router.post("/delete-all", deleteAlldata);
router.get("/daily-views", getDailyViews);
router.get("/file-export", exportAllDataToCSV);
router.get("/paginate-data", getPaginatedVideos);
// router.get("/stats", getStats);
// router.get("/links", getAllLinks);

export default router;
