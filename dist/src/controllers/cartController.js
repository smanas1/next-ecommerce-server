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
exports.clearEntireCart = exports.updateCartItemQuantity = exports.removeFromCart = exports.getCart = exports.addToCart = void 0;
const server_1 = require("../server");
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { productId, quantity, size, color } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const cart = yield server_1.prisma.cart.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
        const cartItem = yield server_1.prisma.cartItem.upsert({
            where: {
                cartId_productId_size_color: {
                    cartId: cart.id,
                    productId,
                    size: size || null,
                    color: color || null,
                },
            },
            update: {
                quantity: { increment: quantity },
            },
            create: {
                cartId: cart.id,
                productId,
                quantity,
                size,
                color,
            },
        });
        const product = yield server_1.prisma.product.findUnique({
            where: { id: productId },
            select: {
                name: true,
                price: true,
                images: true,
            },
        });
        const responseItem = {
            id: cartItem.id,
            productId: cartItem.productId,
            name: product === null || product === void 0 ? void 0 : product.name,
            price: product === null || product === void 0 ? void 0 : product.price,
            image: product === null || product === void 0 ? void 0 : product.images[0],
            color: cartItem.color,
            size: cartItem.size,
            quantity: cartItem.quantity,
        };
        res.status(201).json({
            success: true,
            data: responseItem,
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured!",
        });
    }
});
exports.addToCart = addToCart;
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const cart = yield server_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: true,
            },
        });
        if (!cart) {
            res.json({
                success: false,
                messaage: "No Item found in cart",
                data: [],
            });
            return;
        }
        const cartItemsWithProducts = yield Promise.all(cart === null || cart === void 0 ? void 0 : cart.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield server_1.prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                    name: true,
                    price: true,
                    images: true,
                },
            });
            return {
                id: item.id,
                productId: item.productId,
                name: product === null || product === void 0 ? void 0 : product.name,
                price: product === null || product === void 0 ? void 0 : product.price,
                image: product === null || product === void 0 ? void 0 : product.images[0],
                color: item.color,
                size: item.size,
                quantity: item.quantity,
            };
        })));
        res.json({
            success: true,
            data: cartItemsWithProducts,
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch cart!",
        });
    }
});
exports.getCart = getCart;
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        yield server_1.prisma.cartItem.delete({
            where: {
                id,
                cart: { userId },
            },
        });
        res.status(200).json({
            success: true,
            message: "Item is removed from cart",
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to remove from cart!",
        });
    }
});
exports.removeFromCart = removeFromCart;
const updateCartItemQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        const { quantity } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const updatedItem = yield server_1.prisma.cartItem.update({
            where: {
                id,
                cart: { userId },
            },
            data: { quantity },
        });
        const product = yield server_1.prisma.product.findUnique({
            where: { id: updatedItem.productId },
            select: {
                name: true,
                price: true,
                images: true,
            },
        });
        const responseItem = {
            id: updatedItem.id,
            productId: updatedItem.productId,
            name: product === null || product === void 0 ? void 0 : product.name,
            price: product === null || product === void 0 ? void 0 : product.price,
            image: product === null || product === void 0 ? void 0 : product.images[0],
            color: updatedItem.color,
            size: updatedItem.size,
            quantity: updatedItem.quantity,
        };
        res.json({
            success: true,
            data: responseItem,
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to update cart item quantity",
        });
    }
});
exports.updateCartItemQuantity = updateCartItemQuantity;
const clearEntireCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield server_1.prisma.cartItem.deleteMany({
            where: {
                cart: { userId },
            },
        });
        res.status(200).json({
            success: true,
            message: "cart cleared successfully!",
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to clear cart!",
        });
    }
});
exports.clearEntireCart = clearEntireCart;
