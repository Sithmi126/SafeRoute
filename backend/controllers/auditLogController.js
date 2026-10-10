const auditLogModel = require("../models/auditLogModel");

const getAllAuditLogs = async (req, res) => {
    try {
        const logs = await auditLogModel.findAllAuditLogs();

        return res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Get audit logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit logs"
        });
    }
};

const getMyAuditLogs = async (req, res) => {
    try {
        const logs = await auditLogModel.findAuditLogsByUserId(
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Get user audit logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your audit logs"
        });
    }
};

module.exports = {
    getAllAuditLogs,
    getMyAuditLogs
};