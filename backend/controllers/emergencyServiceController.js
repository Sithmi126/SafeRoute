const emergencyServiceModel = require("../models/emergencyServiceModel");

const createEmergencyService = async (req, res) => {
    try {
        const {
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status
        } = req.body;

        if (
            !name ||
            !service_type ||
            !phone ||
            !address ||
            latitude === undefined ||
            longitude === undefined ||
            !status
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        const id = await emergencyServiceModel.createEmergencyService({
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status
        });

        const service =
            await emergencyServiceModel.findEmergencyServiceById(id);

        return res.status(201).json({
            success: true,
            message: "Emergency service created successfully",
            data: service
        });
    } catch (error) {
        console.error("Create emergency service error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create emergency service"
        });
    }
};

const getAllEmergencyServices = async (req, res) => {
    try {
        const { status, service_type } = req.query;

        const services =
            await emergencyServiceModel.findAllEmergencyServices({
                status,
                service_type
            });

        return res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error("Get emergency services error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve emergency services"
        });
    }
};

const getEmergencyServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID"
            });
        }

        const service =
            await emergencyServiceModel.findEmergencyServiceById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Emergency service not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error("Get emergency service error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve emergency service"
        });
    }
};

const updateEmergencyService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID"
            });
        }

        const existingService =
            await emergencyServiceModel.findEmergencyServiceById(id);

        if (!existingService) {
            return res.status(404).json({
                success: false,
                message: "Emergency service not found"
            });
        }

        const {
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status
        } = req.body;

        if (
            !name ||
            !service_type ||
            !phone ||
            !address ||
            latitude === undefined ||
            longitude === undefined ||
            !status
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        await emergencyServiceModel.updateEmergencyService(id, {
            name,
            service_type,
            phone,
            email,
            address,
            latitude,
            longitude,
            status
        });

        const updatedService =
            await emergencyServiceModel.findEmergencyServiceById(id);

        return res.status(200).json({
            success: true,
            message: "Emergency service updated successfully",
            data: updatedService
        });
    } catch (error) {
        console.error("Update emergency service error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update emergency service"
        });
    }
};

const deleteEmergencyService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID"
            });
        }

        const existingService =
            await emergencyServiceModel.findEmergencyServiceById(id);

        if (!existingService) {
            return res.status(404).json({
                success: false,
                message: "Emergency service not found"
            });
        }

        await emergencyServiceModel.deleteEmergencyService(id);

        return res.status(200).json({
            success: true,
            message: "Emergency service deleted successfully"
        });
    } catch (error) {
        console.error("Delete emergency service error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete emergency service"
        });
    }
};

module.exports = {
    createEmergencyService,
    getAllEmergencyServices,
    getEmergencyServiceById,
    updateEmergencyService,
    deleteEmergencyService
};