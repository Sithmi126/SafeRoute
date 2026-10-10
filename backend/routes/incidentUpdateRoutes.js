const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    createIncidentUpdate,
    getIncidentUpdates
} = require("../controllers/incidentUpdateController");

const router = express.Router();

router.use(authenticateToken);


// Get updates for an incident

router.get(
    "/incidents/:id/updates",
    getIncidentUpdates
);


// Add update to an incident

router.post(
    "/incidents/:id/updates",
    authorizeRoles(
        "ADMIN",
        "RESPONDER",
        "CITIZEN"
    ),
    createIncidentUpdate
);

module.exports = router;