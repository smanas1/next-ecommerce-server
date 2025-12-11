"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const authMiddleware_2 = require("../middleware/authMiddleware");
const reviewController_1 = require("../controllers/reviewController");
const router = express_1.default.Router();
// Create a review (authenticated user)
router.post("/create", authMiddleware_1.authenticateJwt, reviewController_1.createReview);
// Get all reviews for a specific product
router.get("/product/:productId", reviewController_1.getProductReviews);
// Get all reviews by current user
router.get("/user", authMiddleware_1.authenticateJwt, reviewController_1.getUserReviews);
// Update a review (authenticated user)
router.put("/:reviewId", authMiddleware_1.authenticateJwt, reviewController_1.updateReview);
// Delete a review (authenticated user)
router.delete("/:reviewId", authMiddleware_1.authenticateJwt, reviewController_1.deleteReview);
// Check if user can review a product
router.get("/can-review/:productId/:orderId", authMiddleware_1.authenticateJwt, reviewController_1.canReviewProduct);
// Admin routes - Super Admin only
router.get("/", authMiddleware_1.authenticateJwt, authMiddleware_2.isSuperAdmin, reviewController_1.getAllReviews);
router.put("/admin/:reviewId", authMiddleware_1.authenticateJwt, authMiddleware_2.isSuperAdmin, reviewController_1.adminUpdateReview);
router.delete("/admin/:reviewId", authMiddleware_1.authenticateJwt, authMiddleware_2.isSuperAdmin, reviewController_1.adminDeleteReview);
exports.default = router;
