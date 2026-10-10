const express = require("express");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const {
  createIncident,
  getAllIncidents,
  getMyIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
  getIncidentTypes,
  addIncidentImage,
} = require("../controllers/incidentController");

const router = express.Router();

router.use(authenticateToken);

router.get("/types", getIncidentTypes);
router.post("/", authorizeRoles("CITIZEN"), createIncident);
router.get("/my", authorizeRoles("CITIZEN"), getMyIncidents);
router.get("/", authorizeRoles("ADMIN", "RESPONDER"), getAllIncidents);

// Register the status route before /:id.
router.patch("/:id/status", authorizeRoles("ADMIN"), updateIncidentStatus);

router.get("/:id", getIncidentById);
router.put("/:id", authorizeRoles("CITIZEN", "ADMIN"), updateIncident);
router.delete("/:id", authorizeRoles("CITIZEN", "ADMIN"), deleteIncident);
router.post("/:id/images", authorizeRoles("CITIZEN"), addIncidentImage);

module.exports = router;




