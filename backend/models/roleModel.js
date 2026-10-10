const db = require("../config/db");

const findRoleByName = async (name) => {
    const [rows] = await db.query(
        `
        SELECT id, name
        FROM roles
        WHERE name = ?
        LIMIT 1
        `,
        [name]
    );

    return rows[0] || null;
};

module.exports = {
    findRoleByName
};