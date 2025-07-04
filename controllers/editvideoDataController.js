import mongoose from "mongoose";
import VideoStat from "../model/urlmodel.js";

export const UpdateVideoData = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({success: false, message: "Invalid IDfromate"});
        }

        // fields allowed to edit/update
        const allowedFields = [
            'youtubeViews',
            'youtubechannel',
            'youtubeComments',
            'youtubeLikes',
            'facebookchannel',
            'facebookViews',
            'facebookLikes',
            'facebookComments',
            'portalchannel',
            'uploadDate', 
        ];

        // filter req.body to only include allowed fields
        const updateFields = {};         // to store valid field

        const requesteToUpdate = Object.keys(req.body);   // the data come from froun to edit obj,key bec convert object to array to apply loop

        requesteToUpdate.forEach((fieldName) => {
            if(allowedFields.includes(fieldName)) {
                //if allowed, add the field to the updateField object
                updateFields[fieldName] = req.body[fieldName];
            }
        });

        if(Object.keys(updateFields).length === 0) {
            return res.status(400).json({success: false, message: "No valid fields provided for update" });
        }

        // update the doc by ID
        const updatedData = await VideoStat.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).lean();

        if(!updatedData) {
            return res.status(404).json({ success: false, message: "Video not found" });
        };

        return res.status(200).json({
            success: true,
            message: "Data Updated Successfully",
            data: updatedData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating Video",
            error: error.message
        });
    }
}

