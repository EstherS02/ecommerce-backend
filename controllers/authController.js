import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import {
    registerSchema,
    loginSchema
} from "../validators/authValidators.js"
import { email, success } from "zod";

export async function registerUser(req, res) {
    try {

        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error.issues
            })
        }

        const {
            name,
            email,
            password,
            role
        } = result.data;

        const user = await User.findOne({
            email
        })

        if (user) {
            return res.status(409).json({
                "message": "Email already registered"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            name,
            email,
            password: hashedPassword,
            role
        })

        res.status(201).json({
            "message": "User Registered Successfully"
        })

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        res.status(500).json({
            message: error.message
        })
    }
}

export async function loginUser(req, res) {
    try {

        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error.issues
            })
        }

        const {
            email,
            password
        } = result.data;

        const user = await User.findOne({
            email,
            deleted: false
        })

        if (!user) {
            return res.status(401).json({
                message: "Invalid Email or Password"
            })
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Email or Password"
            })
        }

        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        )

        const refreshToken = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
            }
        )

        user.refreshToken = refreshToken;

        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  // because you're using http://localhost /// In dev mode
            sameSite: "lax", // Protects against CSRF attacks.
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: "Login Successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {

        res.status(500).json({
            message: error.message
        })
    }
}

export async function logoutUser(req, res) {
    try {

        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(200).json({
                message: "Logout Successful"
            })
        }

        user.refreshToken = null;

        await user.save();

        res.clearCookie("refreshToken",{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        res.status(200).json({
            message: "Logout Successful"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export async function refreshToken(req, res) {
    try {

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh Token Missing"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        )

        const user = await User.findById(decoded.userId);

        if (!user || (refreshToken !== user.refreshToken)) {
            return res.status(401).json({
                message: "Invalid Refresh Token"
            })
        }

        const newRefreshToken = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
            }
        )

        user.refreshToken = newRefreshToken;

        await user.save();

        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        )

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true, // protect from access as document.cookies
            secure: process.env.NODE_ENV === "production", // used for https , but now in dev mode
            sameSite: "lax", // protects from CSRF 
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        res.status(200).json({
            accessToken
        })

    } catch (error) {

        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid Refresh Token"
            })
        }

        res.status(500).json({
            message: error.message
        })
    }
}