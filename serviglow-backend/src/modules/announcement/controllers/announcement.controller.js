import {
    upsertAnnouncementService,
    getAnnouncementService,
} from "../model/announcement.service.js";

export const upsertAnnouncement = async (req, res) => {
    console.log("request", req.body)
    try {

        const { announcement } = req.body;

        const result = await upsertAnnouncementService(announcement);

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (error) {

        console.log("error", error)

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

export const getAnnouncement = async (req, res) => {
    try {

        const data = await getAnnouncementService();

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};