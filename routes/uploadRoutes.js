import express from "express";
import multer from "multer";
import { uploadCSV, getStats, getAllLinks } from "../controllers/uploadControllers.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), uploadCSV);
router.get("/stats", getStats);
router.get("/links", getAllLinks);

export default router;
