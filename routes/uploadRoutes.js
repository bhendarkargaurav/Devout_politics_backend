import express from "express";
import multer from "multer";
import { uploadCSV, deleteAlldata } from "../controllers/uploadControllers.js";//getAllLinks
// import { uploadCSV } from "../controllers/nuploadControllers.js";
import { getDailyViews } from "../controllers/dailyviewController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), uploadCSV);
// router.get("/stats", getStats);
// router.get("/links", getAllLinks);
router.get("/daily-views", getDailyViews);
router.post("/delete-all", deleteAlldata);

export default router;
