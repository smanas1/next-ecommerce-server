"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const server_1 = require("../server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
function generateToken(userId, email, role) {
    const accessToken = jsonwebtoken_1.default.sign({
        userId,
        email,
        role,
    }, process.env.JWT_SECRET, { expiresIn: "3d" });
    const refreshToken = (0, uuid_1.v4)();
    return { accessToken, refreshToken };
}
function setTokens(res, accessToken, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const isSecure = res.req.secure ||
            res.req.headers["x-forwarded-proto"] === "https";
        const cookieConfig = isSecure
            ? {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            }
            : {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
            };
        const accessTokenOptions = Object.assign(Object.assign({}, cookieConfig), { maxAge: 24 * 60 * 60 * 1000 });
        const refreshTokenOptions = Object.assign(Object.assign({}, cookieConfig), { maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenOptions);
    });
}
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const existingUser = yield server_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: "User with this email exists!",
            });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        const user = yield server_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
            },
        });
        res.status(201).json({
            message: "User registered successfully",
            success: true,
            userId: user.id,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const extractCurrentUser = yield server_1.prisma.user.findUnique({
            where: { email },
        });
        if (!extractCurrentUser ||
            !(yield bcryptjs_1.default.compare(password, extractCurrentUser.password))) {
            res.status(401).json({
                success: false,
                error: "Invalied credentials",
            });
            return;
        }
        //create our access and refreshtoken
        const { accessToken, refreshToken } = generateToken(extractCurrentUser.id, extractCurrentUser.email, extractCurrentUser.role);
        //set out tokens
        yield setTokens(res, accessToken, refreshToken);
        res.status(200).json({
            success: true,
            message: "Login successfully",
            user: {
                id: extractCurrentUser.id,
                name: extractCurrentUser.name,
                email: extractCurrentUser.email,
                role: extractCurrentUser.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
    }
});
exports.login = login;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({
            success: false,
            error: "Invalid refresh token",
        });
        return;
    }
    try {
        const user = yield server_1.prisma.user.findFirst({
            where: {
                refreshToken: refreshToken,
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = generateToken(user.id, user.email, user.role);
        // Set new tokens in cookies
        yield setTokens(res, accessToken, newRefreshToken);
        res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: "Refresh token error",
        });
    }
});
exports.refreshAccessToken = refreshAccessToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
        success: true,
        message: "User logged out successfully",
    });
});
exports.logout = logout;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.user; // Assuming middleware adds user info
        const { name, email } = req.body;
        // Check if another user already has this email
        if (email) {
            const existingUser = yield server_1.prisma.user.findUnique({
                where: { email, NOT: { id: userId } }, // Exclude current user
            });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    error: "Email already in use by another user",
                });
                return;
            }
        }
        const updatedUser = yield server_1.prisma.user.update({
            where: { id: userId },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (email && { email })), { updatedAt: new Date() }),
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            error: "Profile update failed",
        });
    }
});
exports.updateProfile = updateProfile;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.user; // Assuming middleware adds user info
        const user = yield server_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch profile",
        });
    }
});
exports.getProfile = getProfile;
