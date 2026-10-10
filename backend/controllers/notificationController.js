const db = require("../config/db");

// Uses the existing notifications table: id, user_id, title, message, type, is_read, created_at.
async function createNotification({ userId, title, message, type = "GENERAL" }) {
  if (!userId) return;
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [userId, title, message, type]
  );
}

async function createNotificationsForAdmins({ title, message, type = "ASSIGNMENT" }) {
  const [admins] = await db.query(
    `SELECT u.id FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE UPPER(r.name) = 'ADMIN'`
  );
  for (const admin of admins) {
    await createNotification({ userId: admin.id, title, message, type });
  }
}

async function getMyNotifications(req, res) {
  try {
    const [notifications] = await db.query(
      `SELECT id, user_id, title, message, type, is_read, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [req.user.userId]
    );
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
}

async function markNotificationRead(req, res) {
  try {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.userId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await db.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.userId]);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
}

module.exports = { createNotification, createNotificationsForAdmins, getMyNotifications, markNotificationRead, markAllNotificationsRead };
