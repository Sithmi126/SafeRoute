const db = require("../config/db");

const findUserByEmail = async (email) => {
    const [rows] = await db.query(
        `
        SELECT
            u.*,
            r.name AS role_name
        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.id
        WHERE u.email = ?
        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
};

const findUserById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            u.id,
            u.role_id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.profile_image,
            u.status,
            u.created_at,
            u.updated_at,
            r.name AS role_name
        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.id
        WHERE u.id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const createUser = async ({
    role_id,
    first_name,
    last_name,
    email,
    password,
    phone,
    profile_image
}) => {
    const [result] = await db.query(
        `
        INSERT INTO users
        (
            role_id,
            first_name,
            last_name,
            email,
            password,
            phone,
            profile_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            role_id,
            first_name,
            last_name,
            email,
            password,
            phone,
            profile_image
        ]
    );

    return result.insertId;
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser
};