const db = require("../config/db");

const createIncident = async ({
    user_id,
    incident_type_id,
    title,
    description,
    severity,
    latitude,
    longitude,
    address
}) => {
    const [result] = await db.query(
        `
        INSERT INTO incidents
        (
            user_id,
            incident_type_id,
            title,
            description,
            severity,
            latitude,
            longitude,
            address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            user_id,
            incident_type_id,
            title,
            description || null,
            severity,
            latitude,
            longitude,
            address || null
        ]
    );

    return result.insertId;
};

const findIncidentById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            i.*,
            it.name AS incident_type_name,
            it.description AS incident_type_description,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
        FROM incidents i
        INNER JOIN incident_types it ON i.incident_type_id = it.id
        INNER JOIN users u ON i.user_id = u.id
        WHERE i.id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const findAllIncidents = async () => {
    const [rows] = await db.query(
        `
        SELECT
            i.*,
            it.name AS incident_type_name,
            u.first_name,
            u.last_name
        FROM incidents i
        INNER JOIN incident_types it ON i.incident_type_id = it.id
        INNER JOIN users u ON i.user_id = u.id
        ORDER BY i.created_at DESC
        `
    );

    return rows;
};

const findIncidentsByUser = async (userId) => {
    const [rows] = await db.query(
        `
        SELECT
            i.*,
            it.name AS incident_type_name
        FROM incidents i
        INNER JOIN incident_types it ON i.incident_type_id = it.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
        `,
        [userId]
    );

    return rows;
};

const updateIncident = async (
    id,
    {
        title,
        description,
        severity,
        latitude,
        longitude,
        address
    }
) => {
    const [result] = await db.query(
        `
        UPDATE incidents
        SET
            title = ?,
            description = ?,
            severity = ?,
            latitude = ?,
            longitude = ?,
            address = ?
        WHERE id = ?
        `,
        [
            title,
            description || null,
            severity,
            latitude,
            longitude,
            address || null,
            id
        ]
    );

    return result.affectedRows;
};

// Only ADMIN/RESPONDER routes should call this method.
const updateIncidentStatus = async (id, status) => {
    const [result] = await db.query(
        `
        UPDATE incidents
        SET status = ?
        WHERE id = ?
        `,
        [status, id]
    );

    return result.affectedRows;
};

const deleteIncident = async (id) => {
    const [result] = await db.query(
        `
        DELETE FROM incidents
        WHERE id = ?
        `,
        [id]
    );

    return result.affectedRows;
};

const addIncidentImage = async (incident_id, image_url) => {
    const [result] = await db.query(
        `
        INSERT INTO incident_images (incident_id, image_url)
        VALUES (?, ?)
        `,
        [incident_id, image_url]
    );

    return result.insertId;
};

const findIncidentImages = async (incident_id) => {
    const [rows] = await db.query(
        `
        SELECT id, incident_id, image_url, uploaded_at
        FROM incident_images
        WHERE incident_id = ?
        ORDER BY uploaded_at DESC
        `,
        [incident_id]
    );

    return rows;
};

module.exports = {
    createIncident,
    findIncidentById,
    findAllIncidents,
    findIncidentsByUser,
    updateIncident,
    updateIncidentStatus,
    deleteIncident,
    addIncidentImage,
    findIncidentImages
};


