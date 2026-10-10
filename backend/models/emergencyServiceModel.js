const db = require("../config/db");

const createEmergencyService = async ({
    name,
    service_type,
    phone,
    email,
    address,
    latitude,
    longitude,
    status
}) => {
    const [result] = await db.query(
        `
        INSERT INTO emergency_services (
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            service_type,
            phone,
            email || null,
            address,
            latitude,
            longitude,
            status
        ]
    );

    return result.insertId;
};

const findAllEmergencyServices = async ({
    status,
    service_type
} = {}) => {
    let sql = `
        SELECT
            id,
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status,
            created_at,
            updated_at
        FROM emergency_services
        WHERE 1 = 1
    `;

    const params = [];

    if (status) {
        sql += " AND status = ?";
        params.push(status);
    }

    if (service_type) {
        sql += " AND service_type = ?";
        params.push(service_type);
    }

    sql += " ORDER BY name ASC";

    const [rows] = await db.query(sql, params);

    return rows;
};

const findEmergencyServiceById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status,
            created_at,
            updated_at
        FROM emergency_services
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const updateEmergencyService = async (
    id,
    {
        name,
        service_type,
        phone,
        email,
        address,
        latitude,
        longitude,
        status
    }
) => {
    const [result] = await db.query(
        `
        UPDATE emergency_services
        SET
            name = ?,
            service_type = ?,
            phone = ?,
            email = ?,
            address = ?,
            latitude = ?,
            longitude = ?,
            status = ?
        WHERE id = ?
        `,
        [
            name,
            service_type,
            phone,
            email || null,
            address,
            latitude,
            longitude,
            status,
            id
        ]
    );

    return result.affectedRows;
};

const deleteEmergencyService = async (id) => {
    const [result] = await db.query(
        `
        DELETE FROM emergency_services
        WHERE id = ?
        `,
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    createEmergencyService,
    findAllEmergencyServices,
    findEmergencyServiceById,
    updateEmergencyService,
    deleteEmergencyService
};