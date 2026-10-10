const db = require("../config/db");

const createUpdate = async ({
    incident_id,
    updated_by,
    status,
    message
}) => {
    const [result] = await db.query(
        `
        INSERT INTO incident_updates
        (
            incident_id,
            updated_by,
            status,
            message
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            incident_id,
            updated_by,
            status,
            message
        ]
    );

    return result.insertId;
};

const findUpdatesByIncidentId = async (incidentId) => {
    const [rows] = await db.query(
        `
        SELECT
            iu.id,
            iu.incident_id,
            iu.updated_by,
            iu.status,
            iu.message,
            iu.created_at,
            u.first_name,
            u.last_name,
            r.name AS role_name
        FROM incident_updates iu
        INNER JOIN users u
            ON iu.updated_by = u.id
        INNER JOIN roles r
            ON u.role_id = r.id
        WHERE iu.incident_id = ?
        ORDER BY iu.created_at DESC
        `,
        [incidentId]
    );

    return rows;
};

module.exports = {
    createUpdate,
    findUpdatesByIncidentId
};