import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import { isSuperAdmin } from "../middleware/authMiddleware";
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  canReviewProduct,
  getAllReviews,
  adminUpdateReview,
  adminDeleteReview,
} from "../controllers/reviewController";

const router = express.Router();

// Create a review (authenticated user)
router.post("/create", authenticateJwt, createReview);

// Get all reviews for a specific product
router.get("/product/:productId", getProductReviews);

// Get all reviews by current user
router.get("/user", authenticateJwt, getUserReviews);

// Update a review (authenticated user)
router.put("/:reviewId", authenticateJwt, updateReview);

// Delete a review (authenticated user)
router.delete("/:reviewId", authenticateJwt, deleteReview);

// Check if user can review a product
router.get("/can-review/:productId/:orderId", authenticateJwt, canReviewProduct);

// Admin routes - Super Admin only
router.get("/", authenticateJwt, isSuperAdmin, getAllReviews);
router.put("/admin/:reviewId", authenticateJwt, isSuperAdmin, adminUpdateReview);
router.delete("/admin/:reviewId", authenticateJwt, isSuperAdmin, adminDeleteReview);

export default router;