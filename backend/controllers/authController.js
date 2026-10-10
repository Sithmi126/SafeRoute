const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel");
const roleModel = require("../models/roleModel");


// ==========================================
// REGISTER
// ==========================================
const register = async (req, res) => {
    try {
        const {
            role,
            first_name,
            last_name,
            email,
            password,
            phone,
            profile_image
        } = req.body;

        if (
            !role ||
            !first_name ||
            !last_name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role, first name, last name, email and password are required"
            });
        }

        const existingUser = await userModel.findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const roleData = await roleModel.findRoleByName(role);

        if (!roleData) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userId = await userModel.createUser({
            role_id: roleData.id,
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone: phone || null,
            profile_image: profile_image || null
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user_id: userId
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await userModel.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                roleId: user.role_id,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                profile_image: user.profile_image,
                role: user.role_name
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ==========================================
// GET CURRENT USER
// ==========================================
const getMe = async (req, res) => {
    try {
        const user = await userModel.findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                profile_image: user.profile_image,
                status: user.status,
                role: user.role_name,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error("Get me error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get user"
        });
    }
};


module.exports = {
    register,
    login,
    getMe
};