const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    createAssignment,
    getIncidentAssignments,
    getMyAssignments,
    updateAssignment
} = require("../controllers/responderAssignmentController");

const router = express.Router();

router.use(authenticateToken);


// ==========================================
// ADMIN - ASSIGN RESPONDER
// ==========================================

router.post(
    "/incidents/:id/assignments",
    authorizeRoles("ADMIN"),
    createAssignment
);


// ==========================================
// ADMIN / RESPONDER - VIEW INCIDENT ASSIGNMENTS
// ==========================================

router.get(
    "/incidents/:id/assignments",
    authorizeRoles(
        "ADMIN",
        "RESPONDER"
    ),
    getIncidentAssignments
);


// ==========================================
// RESPONDER - VIEW OWN ASSIGNMENTS
// ==========================================

router.get(
    "/my",
    authorizeRoles("RESPONDER"),
    getMyAssignments
);


// ==========================================
// ADMIN / RESPONDER - UPDATE ASSIGNMENT
// ==========================================

router.put(
    "/:id",
    authorizeRoles(
        "ADMIN",
        "RESPONDER"
    ),
    updateAssignment
);

module.exports = router;