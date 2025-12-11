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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoupon = exports.fetchAllCoupons = exports.createCoupon = void 0;
const server_1 = require("../server");
const createCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discountPercent, startDate, endDate, usageLimit } = req.body;
        const newlyCreatedCoupon = yield server_1.prisma.coupon.create({
            data: {
                code,
                discountPercent: parseInt(discountPercent),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit: parseInt(usageLimit),
                usageCount: 0,
            },
        });
        res.status(201).json({
            success: true,
            message: "Coupon created successfully!",
            coupon: newlyCreatedCoupon,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to created coupon",
        });
    }
});
exports.createCoupon = createCoupon;
const fetchAllCoupons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fetchAllCouponsList = yield server_1.prisma.coupon.findMany({
            orderBy: { createdAt: "asc" },
        });
        res.status(201).json({
            success: true,
            message: "Coupon created successfully!",
            couponList: fetchAllCouponsList,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to fetch coupon list",
        });
    }
});
exports.fetchAllCoupons = fetchAllCoupons;
const deleteCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.coupon.delete({
            where: { id },
        });
        res.status(201).json({
            success: true,
            message: "Coupon deleted successfully!",
            id: id,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to delete coupon",
        });
    }
});
exports.deleteCoupon = deleteCoupon;
