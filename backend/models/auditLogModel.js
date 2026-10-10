const db = require("../config/db");

const createAuditLog = async ({
    user_id,
    action,
    entity,
    entity_id,
    description,
    ip_address
}) => {
    const [result] = await db.query(
        `
        INSERT INTO audit_logs (
            user_id,
            action,
            entity,
            entity_id,
            description,
            ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            user_id || null,
            action,
            entity,
            entity_id || null,
            description || null,
            ip_address || null
        ]
    );

    return result.insertId;
};

const findAllAuditLogs = async () => {
    const [rows] = await db.query(
        `
        SELECT
            al.id,
            al.user_id,
            al.action,
            al.entity,
            al.entity_id,
            al.description,
            al.ip_address,
            al.created_at,
            u.first_name,
            u.last_name,
            u.email,
            r.name AS role_name
        FROM audit_logs al
        LEFT JOIN users u
            ON al.user_id = u.id
        LEFT JOIN roles r
            ON u.role_id = r.id
        ORDER BY al.created_at DESC
        `
    );

    return rows;
};

const findAuditLogsByUserId = async (userId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            user_id,
            action,
            entity,
            entity_id,
            description,
            ip_address,
            created_at
        FROM audit_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
};

module.exports = {
    createAuditLog,
    findAllAuditLogs,
    findAuditLogsByUserId
};