"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = exports.authenticateJwt = void 0;
const jose_1 = require("jose");
const authenticateJwt = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        res
            .status(401)
            .json({ success: false, error: "Access token is not present" });
        return;
    }
    (0, jose_1.jwtVerify)(accessToken, new TextEncoder().encode(process.env.JWT_SECRET))
        .then((res) => {
        const payload = res.payload;
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        next();
    })
        .catch((e) => {
        console.error(e);
        res
            .status(401)
            .json({ success: false, error: "Access token is not present" });
    });
};
exports.authenticateJwt = authenticateJwt;
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === "SUPER_ADMIN") {
        next();
    }
    else {
        res
            .status(403)
            .json({
            success: false,
            error: "Access denied! Super admin access required",
        });
    }
};
exports.isSuperAdmin = isSuperAdmin;
