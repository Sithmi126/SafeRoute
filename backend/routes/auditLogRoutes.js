const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    getAllAuditLogs,
    getMyAuditLogs
} = require("../controllers/auditLogController");

const router = express.Router();

router.use(authenticateToken);

router.get(
    "/my",
    getMyAuditLogs
);

router.get(
    "/",
    authorizeRoles("ADMIN"),
    getAllAuditLogs
);

module.exports = router;