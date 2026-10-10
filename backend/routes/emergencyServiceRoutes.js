const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    createEmergencyService,
    getAllEmergencyServices,
    getEmergencyServiceById,
    updateEmergencyService,
    deleteEmergencyService
} = require("../controllers/emergencyServiceController");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAllEmergencyServices);

router.get("/:id", getEmergencyServiceById);

router.post(
    "/",
    authorizeRoles("ADMIN"),
    createEmergencyService
);

router.put(
    "/:id",
    authorizeRoles("ADMIN"),
    updateEmergencyService
);

router.delete(
    "/:id",
    authorizeRoles("ADMIN"),
    deleteEmergencyService
);

module.exports = router;