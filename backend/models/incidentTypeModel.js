const db = require("../config/db");

const findIncidentTypeById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            name,
            description,
            created_at
        FROM incident_types
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const findAllIncidentTypes = async () => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            name,
            description,
            created_at
        FROM incident_types
        ORDER BY name ASC
        `
    );

    return rows;
};

module.exports = {
    findIncidentTypeById,
    findAllIncidentTypes
};