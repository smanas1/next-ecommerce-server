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
exports.getProductsForClient = exports.deleteProduct = exports.updateProduct = exports.getProductByID = exports.fetchAllProductsForAdmin = exports.createProduct = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const server_1 = require("../server");
const fs_1 = __importDefault(require("fs"));
//create a product
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, brand, description, category, gender, sizes, colors, price, stock, } = req.body;
        const files = req.files;
        //upload all images to cloudinary
        const uploadPromises = files.map((file) => cloudinary_1.default.uploader.upload(file.path, {
            folder: "ecommerce",
        }));
        const uploadresults = yield Promise.all(uploadPromises);
        const imageUrls = uploadresults.map((result) => result.secure_url);
        const newlyCreatedProduct = yield server_1.prisma.product.create({
            data: {
                name,
                brand,
                category,
                description,
                gender,
                sizes: sizes.split(","),
                colors: colors.split(","),
                price: parseFloat(price),
                stock: parseInt(stock),
                images: imageUrls,
                soldCount: 0,
                rating: 0,
            },
        });
        //clean the uploaded files
        files.forEach((file) => fs_1.default.unlinkSync(file.path));
        res.status(201).json(newlyCreatedProduct);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.createProduct = createProduct;
//fetch all products (admin side)
const fetchAllProductsForAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fetchAllProducts = yield server_1.prisma.product.findMany();
        res.status(200).json(fetchAllProducts);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.fetchAllProductsForAdmin = fetchAllProductsForAdmin;
//get a single product
const getProductByID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield server_1.prisma.product.findUnique({
            where: { id },
            include: {
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found",
            });
            return;
        }
        res.status(200).json(product);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.getProductByID = getProductByID;
//update  a product (admin)
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, brand, description, category, gender, sizes, colors, price, stock, rating, } = req.body;
        console.log(req.body, "req.body");
        //homework -> you can also implement image update func
        const product = yield server_1.prisma.product.update({
            where: { id },
            data: {
                name,
                brand,
                category,
                description,
                gender,
                sizes: sizes.split(","),
                colors: colors.split(","),
                price: parseFloat(price),
                stock: parseInt(stock),
                rating: parseInt(rating),
            },
        });
        res.status(200).json(product);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.updateProduct = updateProduct;
//delete a product (admin)
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.product.delete({ where: { id } });
        res
            .status(200)
            .json({ success: true, message: "Product deleted successfully" });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.deleteProduct = deleteProduct;
//fetch products with filter (client)
const getProductsForClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const categories = (req.query.categories || "")
            .split(",")
            .filter(Boolean);
        const brands = (req.query.brands || "")
            .split(",")
            .filter(Boolean);
        const sizes = (req.query.sizes || "")
            .split(",")
            .filter(Boolean);
        const colors = (req.query.colors || "")
            .split(",")
            .filter(Boolean);
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder || "desc";
        const skip = (page - 1) * limit;
        const where = {
            AND: [
                categories.length > 0
                    ? {
                        category: {
                            in: categories,
                            mode: "insensitive",
                        },
                    }
                    : {},
                brands.length > 0
                    ? {
                        brand: {
                            in: brands,
                            mode: "insensitive",
                        },
                    }
                    : {},
                sizes.length > 0
                    ? {
                        sizes: {
                            hasSome: sizes,
                        },
                    }
                    : {},
                colors.length > 0
                    ? {
                        colors: {
                            hasSome: colors,
                        },
                    }
                    : {},
                {
                    price: { gte: minPrice, lte: maxPrice },
                },
            ],
        };
        const [products, total] = yield Promise.all([
            server_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            server_1.prisma.product.count({ where }),
        ]);
        console.log(Math.ceil(total / limit), total, limit, "Math.ceil(total / limit)");
        res.status(200).json({
            success: true,
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Some error occured!" });
    }
});
exports.getProductsForClient = getProductsForClient;
