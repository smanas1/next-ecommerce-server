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
exports.deleteAddress = exports.updateAddress = exports.getAddresses = exports.createAddress = void 0;
const server_1 = require("../server");
const createAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Unauthenticated user",
        });
        return;
    }
    const { name, address, city, country, postalCode, phone, isDefault } = req.body;
    if (isDefault) {
        yield server_1.prisma.address.updateMany({
            where: { userId },
            data: {
                isDefault: false,
            },
        });
    }
    const newlyCreatedAddress = yield server_1.prisma.address.create({
        data: {
            userId,
            name,
            address,
            city,
            country,
            postalCode,
            phone,
            isDefault: isDefault || false,
        },
    });
    res.status(201).json({
        success: true,
        address: newlyCreatedAddress,
    });
    try {
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured",
        });
    }
});
exports.createAddress = createAddress;
const getAddresses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const fetchAllAddresses = yield server_1.prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            address: fetchAllAddresses,
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured",
        });
    }
});
exports.getAddresses = getAddresses;
const updateAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingAddress = yield server_1.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existingAddress) {
            res.status(404).json({
                success: false,
                message: "Address not found!",
            });
            return;
        }
        const { name, address, city, country, postalCode, phone, isDefault } = req.body;
        if (isDefault) {
            yield server_1.prisma.address.updateMany({
                where: { userId },
                data: {
                    isDefault: false,
                },
            });
        }
        const updatedAddress = yield server_1.prisma.address.update({
            where: { id },
            data: {
                name,
                address,
                city,
                country,
                postalCode,
                phone,
                isDefault: isDefault || false,
            },
        });
        res.status(200).json({
            success: true,
            address: updatedAddress,
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured",
        });
    }
});
exports.updateAddress = updateAddress;
const deleteAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthenticated user",
            });
            return;
        }
        const existingAddress = yield server_1.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existingAddress) {
            res.status(404).json({
                success: false,
                message: "Address not found!",
            });
            return;
        }
        yield server_1.prisma.address.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: "Address deleted successfully!",
        });
    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured",
        });
    }
});
exports.deleteAddress = deleteAddress;
