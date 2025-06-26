import uploadStatus from "../middleware/uploadStatusMiddleware.js";

export const getUploadStatus = (req, res) => {
  res.status(200).json({
    success: true,
    isUploading: uploadStatus.isUploading,
    remaining: uploadStatus.dataToUpload,
  });
};