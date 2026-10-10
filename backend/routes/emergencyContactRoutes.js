const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    createEmergencyContact,
    getMyEmergencyContacts,
    updateEmergencyContact,
    deleteEmergencyContact
} = require("../controllers/emergencyContactController");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("CITIZEN"));

router.route("/")
    .get(getMyEmergencyContacts)
    .post(createEmergencyContact);

router.route("/:id")
    .put(updateEmergencyContact)
    .delete(deleteEmergencyContact);

module.exports = router;