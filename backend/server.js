const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// Authentication middleware
const {
    authenticateToken,
    authorizeRoles
} = require("./middleware/authMiddleware");

// Module 01 - Authentication
const authRoutes = require("./routes/authRoutes");

// Module 02 - Incidents
const incidentRoutes = require("./routes/incidentRoutes");

// Module 03 - Incident updates
const incidentUpdateRoutes = require("./routes/incidentUpdateRoutes");

// Module 03 - Responder assignments
const responderAssignmentRoutes = require("./routes/responderAssignmentRoutes");

// Module 04 - Emergency services
const emergencyServiceRoutes = require("./routes/emergencyServiceRoutes");

// Module 04 - Emergency contacts
const emergencyContactRoutes = require("./routes/emergencyContactRoutes");

// Module 04 - Notifications
const notificationRoutes = require("./routes/notificationRoutes");

// Module 05 - Audit logs
const auditLogRoutes = require("./routes/auditLogRoutes");

// Initialize Express
const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SafeRoute API is running"
    });
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        const [result] = await db.query(
            "SELECT 1 AS connected"
        );

        res.status(200).json({
            success: true,
            message: "Server and database connected",
            database: result[0].connected === 1
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// ==========================================
// MODULE 01 - AUTHENTICATION
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// MODULE 02 - INCIDENT MANAGEMENT
// ==========================================

app.use("/api/incidents", incidentRoutes);

// ==========================================
// MODULE 03 - INCIDENT UPDATES
// ==========================================

app.use("/api", incidentUpdateRoutes);

// ==========================================
// MODULE 03 - RESPONDER ASSIGNMENTS
// ==========================================

app.use("/api/assignments", responderAssignmentRoutes);

// ==========================================
// MODULE 04 - EMERGENCY SERVICES
// ==========================================

app.use(
    "/api/emergency-services",
    emergencyServiceRoutes
);

// ==========================================
// MODULE 04 - EMERGENCY CONTACTS
// ==========================================

app.use(
    "/api/emergency-contacts",
    emergencyContactRoutes
);

// ==========================================
// MODULE 04 - NOTIFICATIONS
// ==========================================

app.use(
    "/api/notifications",
    notificationRoutes
);

// ==========================================
// MODULE 05 - AUDIT LOGS
// ==========================================

app.use(
    "/api/audit-logs",
    auditLogRoutes
);

// ==========================================
// PROTECTED ROUTE
// ==========================================

app.get(
    "/api/protected",
    authenticateToken,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Protected route accessed",
            user: req.user
        });
    }
);

// ==========================================
// ADMIN ACCESS CHECK
// ==========================================

app.get(
    "/api/admin-test",
    authenticateToken,
    authorizeRoles("ADMIN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Admin access granted",
            user: req.user
        });
    }
);

// ==========================================
// RESPONDER ACCESS CHECK
// ==========================================

app.get(
    "/api/responder-test",
    authenticateToken,
    authorizeRoles("RESPONDER"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Responder access granted",
            user: req.user
        });
    }
);

// ==========================================
// CITIZEN ACCESS CHECK
// ==========================================

app.get(
    "/api/citizen-test",
    authenticateToken,
    authorizeRoles("CITIZEN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Citizen access granted",
            user: req.user
        });
    }
);

// ==========================================
// 404 - ROUTE NOT FOUND
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `SafeRoute server running on port ${PORT}`
    );
});