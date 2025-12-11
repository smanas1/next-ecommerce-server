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
exports.getFeaturedProducts = exports.updateFeaturedProducts = exports.fetchFeatureBanners = exports.addFeatureBanners = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const server_1 = require("../server");
const fs_1 = __importDefault(require("fs"));
const addFeatureBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(404).json({
                success: false,
                message: "No files provided",
            });
            return;
        }
        const uploadPromises = files.map((file) => cloudinary_1.default.uploader.upload(file.path, {
            folder: "ecommerce-feature-banners",
        }));
        const uploadResults = yield Promise.all(uploadPromises);
        const banners = yield Promise.all(uploadResults.map((res) => server_1.prisma.featureBanner.create({
            data: {
                imageUrl: res.secure_url,
            },
        })));
        files.forEach((file) => fs_1.default.unlinkSync(file.path));
        res.status(201).json({
            success: true,
            banners,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to add feature banners",
        });
    }
});
exports.addFeatureBanners = addFeatureBanners;
const fetchFeatureBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const banners = yield server_1.prisma.featureBanner.findMany({
        orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
        success: true,
        banners,
    });
    try {
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to fetch feature banners",
        });
    }
});
exports.fetchFeatureBanners = fetchFeatureBanners;
const updateFeaturedProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length > 8) {
            res.status(400).json({
                success: false,
                message: `Invalid product Id's or too many requests`,
            });
            return;
        }
        //reset all products to not featured
        yield server_1.prisma.product.updateMany({
            data: { isFeatured: false },
        });
        //set selected product as featured
        yield server_1.prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { isFeatured: true },
        });
        res.status(200).json({
            success: true,
            message: "Featured products updated successfully !",
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to update feature products",
        });
    }
});
exports.updateFeaturedProducts = updateFeaturedProducts;
const getFeaturedProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const featuredProducts = yield server_1.prisma.product.findMany({
            where: { isFeatured: true },
        });
        res.status(200).json({
            success: true,
            featuredProducts,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Failed to fetch feature products",
        });
    }
});
exports.getFeaturedProducts = getFeaturedProducts;
