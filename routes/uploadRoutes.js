// import express from "express";
// import multer from "multer";
// import { uploadCSV, deleteAlldata } from "../controllers/uploadControllers.js";//getAllLinks
// import { getPaginatedVideos, exportAllDataToCSV, updatedviewsbydate  } from "../controllers/exportAllDataControllers.js";
// import { getDailyViews } from "../controllers/dailyviewController.js";

// //test
// import { testuploadCSV } from "../controllers/testuploadController.js";

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.post("/upload-csv", upload.single("file"), uploadCSV);//uploadCSV
// router.post("/delete-all", deleteAlldata);
// router.get("/daily-views", getDailyViews);
// router.get("/file-export", exportAllDataToCSV);
// router.get("/paginate-data", getPaginatedVideos);
// router.get("/refresh", updatedviewsbydate);
// // router.get("/stats", getStats);
// // router.get("/links", getAllLinks);

// //testingRoute
// router.post("/upload", upload.single("file"), testuploadCSV);

// export default router;   




import express from "express";
import multer from "multer";
import upload from "../middleware/multer.js"

import { uploadCSV } from "../controllers/uploadControllers.js";
import { getPaginatedVideos, exportAllDataToCSV, updatedviewsbydate  } from "../controllers/exportAllDataControllers.js";
import { getDailyViews } from "../controllers/dailyviewController.js";
import { getUploadStatus } from "../controllers/isUploadingController.js";
import { testuploadCSV, getAllLinks, getYoutubeChannel, getFacebookChannel, deleteAlldata } from "../controllers/testuploadController.js";

const router = express.Router();
// const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), testuploadCSV);//uploadCSV
router.post("/delete-all", deleteAlldata);
router.get("/daily-views", getDailyViews);
router.get("/file-export", exportAllDataToCSV);
router.get("/paginate-data", getPaginatedVideos);
router.get("/refresh", updatedviewsbydate);
router.get("/links", getAllLinks);
router.get("/ytchannel", getYoutubeChannel);
router.get("/fbchannel", getFacebookChannel);
router.get("/isuploading", getUploadStatus);

//testingRoute
router.post("/upload", upload.single("file"), uploadCSV);

export default router;   