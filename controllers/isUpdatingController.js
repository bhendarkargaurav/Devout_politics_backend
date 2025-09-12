import updateStatus from "../middleware/updateStatusMiddleware.js"

export const getUpdateStatus = (req, res) => {

  res.status(200).json({
    success: true,
    isUpdating: updateStatus.isUpdating,
    remaining: updateStatus.dataToUpdate,
  });
};