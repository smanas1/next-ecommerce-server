"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const couponController_1 = require("../controllers/couponController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateJwt);
router.get("/fetch-all-coupons", couponController_1.fetchAllCoupons);
router.post("/create-coupon", authMiddleware_1.isSuperAdmin, couponController_1.createCoupon);
router.delete("/:id", authMiddleware_1.isSuperAdmin, couponController_1.deleteCoupon);
exports.default = router;
