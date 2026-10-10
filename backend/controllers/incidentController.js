const incidentModel = require("../models/incidentModel");
const incidentTypeModel = require("../models/incidentTypeModel");
const db = require("../config/db");

const ALLOWED_STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "DECLINED"];

const createIncident = async (req, res) => {
    try {
        const {
            incident_type_id,
            title,
            description,
            severity,
            latitude,
            longitude,
            address
        } = req.body;

        if (
            !incident_type_id ||
            !title ||
            !severity ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Incident type, title, severity, latitude and longitude are required"
            });
        }

        const incidentType = await incidentTypeModel.findIncidentTypeById(incident_type_id);
        if (!incidentType) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident type"
            });
        }

        const incidentId = await incidentModel.createIncident({
            user_id: req.user.userId,
            incident_type_id,
            title,
            description,
            severity,
            latitude,
            longitude,
            address
        });

        const incident = await incidentModel.findIncidentById(incidentId);
        return res.status(201).json({
            success: true,
            message: "Incident created successfully",
            incident
        });
    } catch (error) {
        console.error("Create incident error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create incident"
        });
    }
};

const getAllIncidents = async (req, res) => {
    try {
        const incidents = await incidentModel.findAllIncidents();
        return res.status(200).json({
            success: true,
            count: incidents.length,
            incidents
        });
    } catch (error) {
        console.error("Get incidents error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get incidents"
        });
    }
};

const getMyIncidents = async (req, res) => {
    try {
        const incidents = await incidentModel.findIncidentsByUser(req.user.userId);
        return res.status(200).json({
            success: true,
            count: incidents.length,
            incidents
        });
    } catch (error) {
        console.error("Get my incidents error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get your incidents"
        });
    }
};

const getIncidentById = async (req, res) => {
    try {
        const incident = await incidentModel.findIncidentById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        // Citizens may only view their own reports.
        if (req.user.role === "CITIZEN" && Number(incident.user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own incidents"
            });
        }

        const images = await incidentModel.findIncidentImages(incident.id);
        return res.status(200).json({
            success: true,
            incident: { ...incident, images }
        });
    } catch (error) {
        console.error("Get incident error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get incident"
        });
    }
};

const updateIncident = async (req, res) => {
    try {
        const incidentId = req.params.id;
        const incident = await incidentModel.findIncidentById(incidentId);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        if (req.user.role === "CITIZEN" && Number(incident.user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own incidents"
            });
        }

        const { title, description, severity, latitude, longitude, address } = req.body;

        if (!title || !severity || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title, severity, latitude and longitude are required"
            });
        }

        await incidentModel.updateIncident(incidentId, {
            title,
            description,
            severity,
            latitude,
            longitude,
            address
        });

        const updatedIncident = await incidentModel.findIncidentById(incidentId);
        return res.status(200).json({
            success: true,
            message: "Incident updated successfully",
            incident: updatedIncident
        });
    } catch (error) {
        console.error("Update incident error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update incident"
        });
    }
};

const updateIncidentStatus = async (req, res) => {
    try {
        const incidentId = req.params.id;
        const status = String(req.body.status || "").trim().toUpperCase();
        const actorRole = String(req.user?.role || req.user?.role_name || "").trim().toUpperCase();

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Use one of: ${ALLOWED_STATUSES.join(", ")}`
            });
        }

        // Declining a citizen's report is an admin-only action.
        if (status === "DECLINED" && actorRole !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only an administrator can decline an incident"
            });
        }

        const incident = await incidentModel.findIncidentById(incidentId);
        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        // Use the shared DB connection directly because older incidentModel versions
        // may not expose an updateIncidentStatus method.
        await db.query("UPDATE incidents SET status = ? WHERE id = ?", [status, incidentId]);

        let notificationCreated = false;
        if (status === "DECLINED") {
            try {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                     VALUES (?, ?, ?, ?, 0, NOW())`,
                    [
                        incident.user_id,
                        "Incident Declined",
                        `Your incident "${incident.title || `#${incidentId}`}" has been declined by the SafeRoute administrator.`,
                        "INCIDENT"
                    ]
                );
                notificationCreated = true;
            } catch (notificationError) {
                // Keep the incident status update successful even if notification creation fails.
                console.error("Incident decline notification error:", notificationError);
            }
        }

        const updatedIncident = await incidentModel.findIncidentById(incidentId);

        return res.status(200).json({
            success: true,
            message: status === "DECLINED"
                ? "Incident declined successfully" + (notificationCreated ? " and citizen notified" : "; notification could not be created")
                : `Incident status changed to ${status}`,
            notification_created: notificationCreated,
            incident: updatedIncident
        });
    } catch (error) {
        console.error("Update incident status error:", error);
        if (error.code === "ER_BAD_FIELD_ERROR") {
            return res.status(500).json({
                success: false,
                message: "Check that the incidents table has a status column and that its status type allows DECLINED."
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update incident status"
        });
    }
};

const deleteIncident = async (req, res) => {
    try {
        const incident = await incidentModel.findIncidentById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        if (req.user.role === "CITIZEN" && Number(incident.user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own incidents"
            });
        }

        await incidentModel.deleteIncident(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Incident deleted successfully"
        });
    } catch (error) {
        console.error("Delete incident error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete incident"
        });
    }
};

const getIncidentTypes = async (req, res) => {
    try {
        const types = await incidentTypeModel.findAllIncidentTypes();
        return res.status(200).json({
            success: true,
            count: types.length,
            incident_types: types
        });
    } catch (error) {
        console.error("Get incident types error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get incident types"
        });
    }
};

const addIncidentImage = async (req, res) => {
    try {
        const { image_url } = req.body;
        const incidentId = req.params.id;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required"
            });
        }

        const incident = await incidentModel.findIncidentById(incidentId);
        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        if (req.user.role === "CITIZEN" && Number(incident.user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can only add images to your own incidents"
            });
        }

        const imageId = await incidentModel.addIncidentImage(incidentId, image_url);
        return res.status(201).json({
            success: true,
            message: "Incident image added successfully",
            image_id: imageId
        });
    } catch (error) {
        console.error("Add incident image error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add incident image"
        });
    }
};

module.exports = {
    createIncident,
    getAllIncidents,
    getMyIncidents,
    getIncidentById,
    updateIncident,
    updateIncidentStatus,
    deleteIncident,
    getIncidentTypes,
    addIncidentImage
};










