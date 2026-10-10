const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();
router.use(authenticateToken);
router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
module.exports = router;

