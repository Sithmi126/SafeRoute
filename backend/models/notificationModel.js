const db = require("../config/db");

const createNotification = async ({
    user_id,
    title,
    message,
    type
}) => {
    const [result] = await db.query(
        `
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type
        )
        VALUES (?, ?, ?, ?)
        `,
        [user_id, title, message, type]
    );

    return result.insertId;
};

const findNotificationsByUserId = async (userId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
};

const findNotificationById = async (id, userId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [id, userId]
    );

    return rows[0] || null;
};

const markNotificationAsRead = async (id, userId) => {
    const [result] = await db.query(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
        `,
        [id, userId]
    );

    return result.affectedRows;
};

const deleteNotification = async (id, userId) => {
    const [result] = await db.query(
        `
        DELETE FROM notifications
        WHERE id = ?
          AND user_id = ?
        `,
        [id, userId]
    );

    return result.affectedRows;
};

module.exports = {
    createNotification,
    findNotificationsByUserId,
    findNotificationById,
    markNotificationAsRead,
    deleteNotification
};