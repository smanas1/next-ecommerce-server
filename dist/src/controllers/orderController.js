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
exports.getOrdersByUserId = exports.getAllOrdersForAdmin = exports.updateOrderStatus = exports.getOrder = exports.createFinalOrder = exports.capturePaypalOrder = exports.createPaypalOrder = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const server_1 = require("../server");
const PAYPAL_CLIENT_ID = "AYYtmQuBVHm_q4fO-nRv84xIKhQk1-BdhSLckYRxcBJLhxI5EcxafPKdkvKpqLDP-pNLNXalxvlUSgZE";
const PAYPAL_CLIENT_SECRET = "EH6X0HMUA-0gB0Z1m8fq_p-YTy1dDLZT7Zs-Q8VcuX33xJN9RID883YWb38JSMwz88t2grJNwKR5ct_W";
function getPaypalAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.post("https://api-m.sandbox.paypal.com/v1/oauth2/token", "grant_type=client_credentials", {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
            },
        });
        return response.data.access_token;
    });
}
const createPaypalOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, total } = req.body;
        const accessToken = yield getPaypalAccessToken();
        const paypalItems = items.map((item) => ({
            name: item.name,
            description: item.description || "",
            sku: item.id,
            unit_amount: {
                currency_code: "USD",
                value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            category: "PHYSICAL_GOODS",
        }));
        const itemTotal = paypalItems.reduce((sum, item) => sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity), 0);
        const response = yield axios_1.default.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: itemTotal.toFixed(2),
                            },
                        },
                    },
                    items: paypalItems,
                },
            ],
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "PayPal-Request-ID": (0, uuid_1.v4)(),
            },
        });
        res.status(200).json(response.data);
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.createPaypalOrder = createPaypalOrder;
const capturePaypalOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.body;
        const accessToken = yield getPaypalAccessToken();
        const response = yield axios_1.default.post(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });
        res.status(200).json(response.data);
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.capturePaypalOrder = capturePaypalOrder;
const createFinalOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { items, addressId, couponId, total, paymentId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log(items, "itemsitemsitems");
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        //start our transaction
        const order = yield server_1.prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            //create new order
            const newOrder = yield prisma.order.create({
                data: {
                    userId,
                    addressId,
                    couponId,
                    total,
                    paymentMethod: "CREDIT_CARD",
                    paymentStatus: "COMPLETED",
                    paymentId,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            productCategory: item.productCategory,
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color,
                            price: item.price,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });
            for (const item of items) {
                yield prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                        soldCount: { increment: item.quantity },
                    },
                });
            }
            yield prisma.cartItem.deleteMany({
                where: {
                    cart: { userId },
                },
            });
            yield prisma.cart.delete({
                where: { userId },
            });
            if (couponId) {
                yield prisma.coupon.update({
                    where: { id: couponId },
                    data: { usageCount: { increment: 1 } },
                });
            }
            return newOrder;
        }));
        res.status(201).json(order);
    }
    catch (e) {
        console.log(e, "createFinalOrder");
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.createFinalOrder = createFinalOrder;
const getOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { orderId } = req.params;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const order = yield server_1.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            include: {
                items: true,
                address: true,
                coupon: true,
            },
        });
        res.status(200).json(order);
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.getOrder = getOrder;
const updateOrderStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { orderId } = req.params;
        const { status } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        yield server_1.prisma.order.updateMany({
            where: {
                id: orderId,
            },
            data: {
                status,
            },
        });
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.updateOrderStatus = updateOrderStatus;
const getAllOrdersForAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const orders = yield server_1.prisma.order.findMany({
            include: {
                items: true,
                address: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(200).json(orders);
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.getAllOrdersForAdmin = getAllOrdersForAdmin;
const getOrdersByUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const orders = yield server_1.prisma.order.findMany({
            where: {
                userId: userId,
            },
            include: {
                items: true,
                address: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(orders);
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Unexpected error occured!",
        });
    }
});
exports.getOrdersByUserId = getOrdersByUserId;
