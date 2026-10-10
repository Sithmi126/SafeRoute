const db = require("../config/db");

const createAssignment = async ({
    incident_id,
    responder_id,
    status,
    notes
}) => {
    const [result] = await db.query(
        `
        INSERT INTO responder_assignments
        (
            incident_id,
            responder_id,
            status,
            notes
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            incident_id,
            responder_id,
            status,
            notes || null
        ]
    );

    return result.insertId;
};

const findAssignmentById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            ra.*,
            u.first_name AS responder_first_name,
            u.last_name AS responder_last_name,
            u.email AS responder_email,
            u.phone AS responder_phone
        FROM responder_assignments ra
        INNER JOIN users u
            ON ra.responder_id = u.id
        WHERE ra.id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const findAssignmentsByIncidentId = async (incidentId) => {
    const [rows] = await db.query(
        `
        SELECT
            ra.*,
            u.first_name AS responder_first_name,
            u.last_name AS responder_last_name,
            u.email AS responder_email,
            u.phone AS responder_phone
        FROM responder_assignments ra
        INNER JOIN users u
            ON ra.responder_id = u.id
        WHERE ra.incident_id = ?
        ORDER BY ra.assigned_at DESC
        `,
        [incidentId]
    );

    return rows;
};

const findAssignmentsByResponderId = async (responderId) => {
    const [rows] = await db.query(
        `
        SELECT
            ra.*,
            i.user_id AS citizen_id,
            i.title AS incident_title,
            i.description AS incident_description,
            i.severity,
            i.status AS incident_status,
            i.latitude,
            i.longitude,
            i.address,
            i.created_at AS incident_created_at,
            it.name AS incident_type_name,
            citizen.first_name AS citizen_first_name,
            citizen.last_name AS citizen_last_name,
            citizen.email AS citizen_email,
            citizen.phone AS citizen_phone
        FROM responder_assignments ra
        INNER JOIN incidents i ON ra.incident_id = i.id
        INNER JOIN incident_types it ON i.incident_type_id = it.id
        INNER JOIN users citizen ON i.user_id = citizen.id
        WHERE ra.responder_id = ?
          AND UPPER(i.status) IN ('IN_PROGRESS', 'RESOLVED')
        ORDER BY ra.assigned_at DESC
        `,
        [responderId]
    );

    return rows;
};

const updateAssignment = async (
    id,
    {
        status,
        accepted_at,
        completed_at,
        notes
    }
) => {
    const [result] = await db.query(
        `
        UPDATE responder_assignments
        SET
            status = ?,
            accepted_at = ?,
            completed_at = ?,
            notes = ?
        WHERE id = ?
        `,
        [
            status,
            accepted_at,
            completed_at,
            notes || null,
            id
        ]
    );

    return result.affectedRows;
};

module.exports = {
    createAssignment,
    findAssignmentById,
    findAssignmentsByIncidentId,
    findAssignmentsByResponderId,
    updateAssignment
};