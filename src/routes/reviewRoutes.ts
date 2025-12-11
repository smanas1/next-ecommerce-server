import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  canReviewProduct,
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

export default router;