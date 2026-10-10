const db = require("../config/db");

const createEmergencyContact = async ({
    user_id,
    name,
    relationship,
    phone,
    priority
}) => {
    const [result] = await db.query(
        `
        INSERT INTO emergency_contacts (
            user_id,
            name,
            relationship,
            phone,
            priority
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            user_id,
            name,
            relationship,
            phone,
            priority
        ]
    );

    return result.insertId;
};

const findContactsByUserId = async (userId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            user_id,
            name,
            relationship,
            phone,
            priority,
            created_at
        FROM emergency_contacts
        WHERE user_id = ?
        ORDER BY priority ASC, created_at DESC
        `,
        [userId]
    );

    return rows;
};

const findContactById = async (id, userId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            user_id,
            name,
            relationship,
            phone,
            priority,
            created_at
        FROM emergency_contacts
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [id, userId]
    );

    return rows[0] || null;
};

const updateEmergencyContact = async (
    id,
    userId,
    {
        name,
        relationship,
        phone,
        priority
    }
) => {
    const [result] = await db.query(
        `
        UPDATE emergency_contacts
        SET
            name = ?,
            relationship = ?,
            phone = ?,
            priority = ?
        WHERE id = ?
          AND user_id = ?
        `,
        [
            name,
            relationship,
            phone,
            priority,
            id,
            userId
        ]
    );

    return result.affectedRows;
};

const deleteEmergencyContact = async (id, userId) => {
    const [result] = await db.query(
        `
        DELETE FROM emergency_contacts
        WHERE id = ?
          AND user_id = ?
        `,
        [id, userId]
    );

    return result.affectedRows;
};

module.exports = {
    createEmergencyContact,
    findContactsByUserId,
    findContactById,
    updateEmergencyContact,
    deleteEmergencyContact
};