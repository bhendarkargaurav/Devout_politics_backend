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

import { 
    getPaginatedVideos, 
    exportAllDataToCSV,  
    exportChannelData, 
    updatedviewsbydate  
} from "../controllers/exportAllDataControllers.js";

import { getUploadStatus } from "../controllers/isUploadingController.js";

import { 
    getAllDataWithFilters,
    getDailyViews, 
    getAllYoutubeData, 
    getAllFacebookData, 
    getAllPortalData 
} from "../controllers/dailyviewController.js";

import { 
    testuploadCSV, 
    getAllLinks, 
    getYoutubeChannel, 
    getYoutubeChannelData, 
    getFacebookChannel, 
    getFacebookChannelData,
    getPortalchannel, 
    getportalData,
    deleteAlldata 
} from "../controllers/testuploadController.js";

import { UpdateVideoData } from "../controllers/editvideoDataController.js"

const router = express.Router();
// const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), testuploadCSV);//uploadCSV
router.post("/delete-all", deleteAlldata);

router.get("/getalldata/filter", getAllDataWithFilters);
router.get("/daily-views", getDailyViews);

router.get("/file-export", exportAllDataToCSV);
router.get("/paginate-data", getPaginatedVideos);
router.get("/refresh", updatedviewsbydate);
router.get("/links", getAllLinks);
router.get("/ytchannel", getYoutubeChannel);
router.get("/ytchannel-data", getYoutubeChannelData);

router.get("/fbchannel", getFacebookChannel);
router.get("/fbchannel-data", getFacebookChannelData);

//get all data for youtube for dashboard for pagination
router.get("/all-ytdata", getAllYoutubeData);

//get all data for facebook for dashboard pagination
router.get("/all-fbdata", getAllFacebookData);

// get all dat afor portal for dashboard
router.get("/all-podata", getAllPortalData );

router.get("/export-channel-data", exportChannelData);

router.get("/portal-channel", getPortalchannel);
router.get("/portal-data", getportalData)

router.get("/isuploading", getUploadStatus);
router.patch("/do-update/:id", UpdateVideoData);

//testingRoute
router.post("/upload", upload.single("file"), uploadCSV);

//server should load without sleep
router.get("/health", (req, res) => {
    res.status(200).send('OK');
})


export default router;   