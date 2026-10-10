const emergencyContactModel =
    require("../models/emergencyContactModel");

const createEmergencyContact = async (req, res) => {
    try {
        const {
            name,
            relationship,
            phone,
            priority
        } = req.body;

        if (
            !name ||
            !relationship ||
            !phone ||
            priority === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const id =
            await emergencyContactModel.createEmergencyContact({
                user_id: req.user.userId,
                name,
                relationship,
                phone,
                priority
            });

        const contact =
            await emergencyContactModel.findContactById(
                id,
                req.user.userId
            );

        return res.status(201).json({
            success: true,
            message: "Emergency contact created successfully",
            data: contact
        });
    } catch (error) {
        console.error("Create emergency contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create emergency contact"
        });
    }
};

const getMyEmergencyContacts = async (req, res) => {
    try {
        const contacts =
            await emergencyContactModel.findContactsByUserId(
                req.user.userId
            );

        return res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        console.error("Get emergency contacts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve emergency contacts"
        });
    }
};

const updateEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID"
            });
        }

        const existingContact =
            await emergencyContactModel.findContactById(
                id,
                req.user.userId
            );

        if (!existingContact) {
            return res.status(404).json({
                success: false,
                message: "Emergency contact not found"
            });
        }

        const {
            name,
            relationship,
            phone,
            priority
        } = req.body;

        if (
            !name ||
            !relationship ||
            !phone ||
            priority === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        await emergencyContactModel.updateEmergencyContact(
            id,
            req.user.userId,
            {
                name,
                relationship,
                phone,
                priority
            }
        );

        const updatedContact =
            await emergencyContactModel.findContactById(
                id,
                req.user.userId
            );

        return res.status(200).json({
            success: true,
            message: "Emergency contact updated successfully",
            data: updatedContact
        });
    } catch (error) {
        console.error("Update emergency contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update emergency contact"
        });
    }
};

const deleteEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID"
            });
        }

        const existingContact =
            await emergencyContactModel.findContactById(
                id,
                req.user.userId
            );

        if (!existingContact) {
            return res.status(404).json({
                success: false,
                message: "Emergency contact not found"
            });
        }

        await emergencyContactModel.deleteEmergencyContact(
            id,
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            message: "Emergency contact deleted successfully"
        });
    } catch (error) {
        console.error("Delete emergency contact error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete emergency contact"
        });
    }
};

module.exports = {
    createEmergencyContact,
    getMyEmergencyContacts,
    updateEmergencyContact,
    deleteEmergencyContact
};