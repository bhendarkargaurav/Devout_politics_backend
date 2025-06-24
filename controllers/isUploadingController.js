export const IsDbRunning = async (req, res) => {
  return res.status(200).json({
    success: true,
    uploadingStatus: uploadStatus.isUploading,
    toUpload: uploadStatus.dataToUpload,
  });
};
