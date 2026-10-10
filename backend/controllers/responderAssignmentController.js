const responderAssignmentModel =
    require("../models/responderAssignmentModel");

const incidentModel =
    require("../models/incidentModel");

const db =
    require("../config/db");

const { createNotification, createNotificationsForAdmins } =
    require("./notificationController");

const findResponderById = async (responderId) => {
    const [rows] = await db.query(
        `
        SELECT
            u.id,
            u.role_id,
            r.name AS role_name,
            u.status
        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.id
        WHERE u.id = ?
        LIMIT 1
        `,
        [responderId]
    );

    return rows[0] || null;
};


// ==========================================
// CREATE ASSIGNMENT
// ==========================================

const createAssignment = async (req, res) => {
    try {
        const incidentId = req.params.id;

        const {
            responder_id,
            status,
            notes
        } = req.body;

        if (!responder_id || !status) {
            return res.status(400).json({
                success: false,
                message:
                    "Responder ID and status are required"
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

        // In this project, an incident moved to IN_PROGRESS by Admin is approved.
        if (!["IN_PROGRESS", "RESOLVED"].includes(String(incident.status || "").toUpperCase())) {
            return res.status(409).json({
                success: false,
                message: "Admin must approve this incident by setting its status to In progress before assigning it to a responder."
            });
        }

        const responder =
            await findResponderById(
                responder_id
            );

        if (!responder) {
            return res.status(404).json({
                success: false,
                message: "Responder not found"
            });
        }

        if (responder.role_name !== "RESPONDER") {
            return res.status(400).json({
                success: false,
                message:
                    "Selected user is not a responder"
            });
        }

        const assignmentId =
            await responderAssignmentModel.createAssignment({
                incident_id: incidentId,
                responder_id,
                status,
                notes
            });

        const assignment =
            await responderAssignmentModel.findAssignmentById(
                assignmentId
            );

        await createNotification({
            userId: Number(responder_id),
            title: "New incident assignment",
            message: `Incident #${incidentId} has been assigned to you. Please review and accept or decline it.`,
            type: "ASSIGNMENT"
        });

        return res.status(201).json({
            success: true,
            message:
                "Responder assigned successfully",
            assignment
        });

    } catch (error) {
        console.error(
            "Create responder assignment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create responder assignment"
        });
    }
};


// ==========================================
// GET INCIDENT ASSIGNMENTS
// ==========================================

const getIncidentAssignments = async (req, res) => {
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

        const assignments =
            await responderAssignmentModel
                .findAssignmentsByIncidentId(
                    incidentId
                );

        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error(
            "Get incident assignments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to get incident assignments"
        });
    }
};


// ==========================================
// GET MY ASSIGNMENTS
// ==========================================

const getMyAssignments = async (req, res) => {
    try {
        const assignments =
            await responderAssignmentModel
                .findAssignmentsByResponderId(
                    req.user.userId
                );

        // Include all report photos so the responder can review the approved incident.
        const detailedAssignments = await Promise.all(assignments.map(async (assignment) => {
            const images = await incidentModel.findIncidentImages(assignment.incident_id);
            return { ...assignment, images };
        }));

        return res.status(200).json({
            success: true,
            count: detailedAssignments.length,
            assignments: detailedAssignments
        });

    } catch (error) {
        console.error(
            "Get my assignments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to get your assignments"
        });
    }
};


// ==========================================
// UPDATE ASSIGNMENT
// ==========================================

const updateAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const {
            status,
            notes
        } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const assignment =
            await responderAssignmentModel
                .findAssignmentById(
                    assignmentId
                );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message:
                    "Responder assignment not found"
            });
        }

        if (
            req.user.role === "RESPONDER" &&
            Number(assignment.responder_id) !== Number(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only update your own assignments"
            });
        }

        const allowedStatuses = ["ASSIGNED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"];
        const nextStatus = String(status).toUpperCase();
        if (!allowedStatuses.includes(nextStatus)) {
            return res.status(400).json({ success: false, message: "Invalid assignment status" });
        }
        if (req.user.role === "RESPONDER" && !["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"].includes(nextStatus)) {
            return res.status(403).json({ success: false, message: "Responders can accept, decline, or progress their own assignments only" });
        }
        if (req.user.role === "RESPONDER" && String(assignment.status).toUpperCase() !== "ASSIGNED" && nextStatus !== String(assignment.status).toUpperCase()) {
            return res.status(409).json({ success: false, message: "This assignment has already been responded to" });
        }

        let acceptedAt =
            assignment.accepted_at;

        let completedAt =
            assignment.completed_at;

        /*
         * Timestamp handling is based on the
         * status received from the client.
         *
         * We do not hardcode a database default.
         */

        if (
            status !== assignment.status &&
            nextStatus === "ACCEPTED" &&
            !acceptedAt
        ) {
            acceptedAt = new Date();
        }

        if (
            status !== assignment.status &&
            nextStatus === "COMPLETED" &&
            !completedAt
        ) {
            completedAt = new Date();
        }

        await responderAssignmentModel.updateAssignment(
            assignmentId,
            {
                status: nextStatus,
                accepted_at: acceptedAt,
                completed_at: completedAt,
                notes
            }
        );

        const updatedAssignment =
            await responderAssignmentModel
                .findAssignmentById(
                    assignmentId
                );

        if (req.user.role === "RESPONDER" && ["ACCEPTED", "DECLINED"].includes(nextStatus) && nextStatus !== String(assignment.status).toUpperCase()) {
            const accepted = nextStatus === "ACCEPTED";
            const outcome = accepted ? "accepted" : "rejected";
            const incident = await incidentModel.findIncidentById(assignment.incident_id);
            const incidentTitle = incident?.title || `Incident #${assignment.incident_id}`;
            const responderName = [updatedAssignment?.responder_first_name, updatedAssignment?.responder_last_name]
                .filter(Boolean).join(" ") || `Responder #${req.user.userId}`;
            const message = `${responderName} ${outcome} the responder assignment for ${incidentTitle} (incident #${assignment.incident_id}).`;

            // Keep the assignment update successful even if a notification insert fails.
            try {
                await createNotificationsForAdmins({
                    title: accepted ? "Responder accepted incident" : "Responder rejected incident",
                    message,
                    type: "ASSIGNMENT"
                });
                if (incident?.user_id) {
                    await createNotification({
                        userId: Number(incident.user_id),
                        title: accepted ? "Responder accepted your report" : "Responder rejected your report",
                        message: accepted
                            ? `A responder has accepted your incident report: ${incidentTitle}.`
                            : `A responder has rejected the assignment for your incident report: ${incidentTitle}. The administration has been notified.`,
                        type: "ASSIGNMENT"
                    });
                }
            } catch (notificationError) {
                console.error("Responder decision notification error:", notificationError);
            }
        }

        return res.status(200).json({
            success: true,
            message:
                "Responder assignment updated successfully",
            assignment: updatedAssignment
        });

    } catch (error) {
        console.error(
            "Update responder assignment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update responder assignment"
        });
    }
};


module.exports = {
    createAssignment,
    getIncidentAssignments,
    getMyAssignments,
    updateAssignment
};