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
exports.adminDeleteReview = exports.adminUpdateReview = exports.getAllReviews = exports.canReviewProduct = exports.deleteReview = exports.updateReview = exports.getUserReviews = exports.getProductReviews = exports.createReview = void 0;
const server_1 = require("../server");
/**
 * Create a new review for a product
 */
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId, orderId, rating, title, comment } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Validate rating range (1 to 5)
        if (rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
            return;
        }
        // Check if the user has purchased the product and the order status is DELIVERED
        const order = yield server_1.prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId,
                status: "DELIVERED",
            },
            include: {
                items: {
                    where: {
                        productId: productId,
                    },
                },
            },
        });
        if (!order || order.items.length === 0) {
            res.status(403).json({
                success: false,
                message: "You can only review products that you have purchased and that have been delivered",
            });
            return;
        }
        // Check if user has already reviewed this product for this order
        const existingReview = yield server_1.prisma.review.findFirst({
            where: {
                productId: productId,
                userId: userId,
                orderId: orderId,
            },
        });
        if (existingReview) {
            res.status(409).json({
                success: false,
                message: "You have already reviewed this product for this order",
            });
            return;
        }
        // Create the review
        const review = yield server_1.prisma.review.create({
            data: {
                productId,
                userId,
                orderId,
                rating,
                title,
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Update the product's average rating
        yield updateProductAverageRating(productId);
        res.status(201).json({
            success: true,
            message: "Review created successfully",
            review,
        });
    }
    catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the review",
        });
    }
});
exports.createReview = createReview;
/**
 * Get all reviews for a specific product
 */
const getProductReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const reviews = yield server_1.prisma.review.findMany({
            where: {
                productId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            success: true,
            reviews,
        });
    }
    catch (error) {
        console.error("Error getting product reviews:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving reviews",
        });
    }
});
exports.getProductReviews = getProductReviews;
/**
 * Get all reviews by a specific user
 */
const getUserReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const reviews = yield server_1.prisma.review.findMany({
            where: {
                userId
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                    },
                },
                order: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            success: true,
            reviews,
        });
    }
    catch (error) {
        console.error("Error getting user reviews:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving reviews",
        });
    }
});
exports.getUserReviews = getUserReviews;
/**
 * Update an existing review
 */
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Validate rating range (1 to 5)
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
            return;
        }
        // Find the review and ensure it belongs to the user
        const review = yield server_1.prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: userId,
            },
        });
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to update it",
            });
            return;
        }
        // Update the review
        const updatedReview = yield server_1.prisma.review.update({
            where: {
                id: reviewId,
            },
            data: Object.assign(Object.assign(Object.assign({}, (rating !== undefined && { rating })), (title !== undefined && { title })), (comment !== undefined && { comment })),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Update the product's average rating
        yield updateProductAverageRating(review.productId);
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview,
        });
    }
    catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the review",
        });
    }
});
exports.updateReview = updateReview;
/**
 * Delete a review
 */
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Find the review and ensure it belongs to the user
        const review = yield server_1.prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: userId,
            },
        });
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to delete it",
            });
            return;
        }
        // Delete the review
        yield server_1.prisma.review.delete({
            where: {
                id: reviewId,
            },
        });
        // Update the product's average rating since a review was removed
        yield updateProductAverageRating(review.productId);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the review",
        });
    }
});
exports.deleteReview = deleteReview;
/**
 * Check if user can review a specific product from a specific order
 */
const canReviewProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId, orderId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Check if the user has purchased the product and the order status is DELIVERED
        const order = yield server_1.prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId,
                status: "DELIVERED",
            },
            include: {
                items: {
                    where: {
                        productId: productId,
                    },
                },
            },
        });
        if (!order || order.items.length === 0) {
            res.status(200).json({
                success: true,
                canReview: false,
                message: "You cannot review this product",
            });
            return;
        }
        // Check if user has already reviewed this product for this order
        const existingReview = yield server_1.prisma.review.findFirst({
            where: {
                productId: productId,
                userId: userId,
                orderId: orderId,
            },
        });
        res.status(200).json({
            success: true,
            canReview: !existingReview,
            message: existingReview
                ? "You have already reviewed this product for this order"
                : "You can review this product",
        });
    }
    catch (error) {
        console.error("Error checking if user can review product:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while checking if you can review the product",
        });
    }
});
exports.canReviewProduct = canReviewProduct;
/**
 * Get all reviews (admin only)
 */
const getAllReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviews = yield server_1.prisma.review.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            success: true,
            reviews,
        });
    }
    catch (error) {
        console.error("Error getting all reviews:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving reviews",
        });
    }
});
exports.getAllReviews = getAllReviews;
/**
 * Update a review (admin only)
 */
const adminUpdateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        // Validate rating range (1 to 5)
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
            return;
        }
        // Find the review
        const review = yield server_1.prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Update the review
        const updatedReview = yield server_1.prisma.review.update({
            where: {
                id: reviewId,
            },
            data: Object.assign(Object.assign(Object.assign({}, (rating !== undefined && { rating })), (title !== undefined && { title })), (comment !== undefined && { comment })),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        // Update the product's average rating
        yield updateProductAverageRating(review.productId);
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview,
        });
    }
    catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the review",
        });
    }
});
exports.adminUpdateReview = adminUpdateReview;
/**
 * Delete a review (admin only)
 */
const adminDeleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reviewId } = req.params;
        // Find the review
        const review = yield server_1.prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Delete the review
        yield server_1.prisma.review.delete({
            where: {
                id: reviewId,
            },
        });
        // Update the product's average rating since a review was removed
        yield updateProductAverageRating(review.productId);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the review",
        });
    }
});
exports.adminDeleteReview = adminDeleteReview;
/**
 * Helper function to update product average rating
 */
function updateProductAverageRating(productId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Calculate average rating for the product
            const ratings = yield server_1.prisma.review.aggregate({
                where: {
                    productId,
                },
                _avg: {
                    rating: true,
                },
            });
            const avgRating = ratings._avg.rating;
            // Update the product's rating field
            yield server_1.prisma.product.update({
                where: {
                    id: productId,
                },
                data: {
                    rating: avgRating,
                },
            });
        }
        catch (error) {
            console.error("Error updating product average rating:", error);
        }
    });
}
