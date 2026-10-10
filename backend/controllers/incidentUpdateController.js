const incidentUpdateModel = require("../models/incidentUpdateModel");
const incidentModel = require("../models/incidentModel");

const createIncidentUpdate = async (req, res) => {
    try {
        const incidentId = req.params.id;

        const {
            status,
            message
        } = req.body;

        if (!status || !message) {
            return res.status(400).json({
                success: false,
                message: "Status and message are required"
            });
        }

        const incident =
            await incidentModel.findIncidentById(
                incidentId
            );

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const updateId =
            await incidentUpdateModel.createUpdate({
                incident_id: incidentId,
                updated_by: req.user.userId,
                status,
                message
            });

        const updates =
            await incidentUpdateModel.findUpdatesByIncidentId(
                incidentId
            );

        return res.status(201).json({
            success: true,
            message: "Incident update created successfully",
            update_id: updateId,
            updates
        });

    } catch (error) {
        console.error(
            "Create incident update error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create incident update"
        });
    }
};

const getIncidentUpdates = async (req, res) => {
    try {
        const incidentId = req.params.id;

        const incident =
            await incidentModel.findIncidentById(
                incidentId
            );

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const updates =
            await incidentUpdateModel.findUpdatesByIncidentId(
                incidentId
            );

        return res.status(200).json({
            success: true,
            count: updates.length,
            updates
        });

    } catch (error) {
        console.error(
            "Get incident updates error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get incident updates"
        });
    }
};

module.exports = {
    createIncidentUpdate,
    getIncidentUpdates
};