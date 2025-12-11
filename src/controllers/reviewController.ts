import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";

/**
 * Create a new review for a product
 */
export const createReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId, orderId, rating, title, comment } = req.body;
    const userId = req.user?.userId;

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
    const order = await prisma.order.findFirst({
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
    const existingReview = await prisma.review.findFirst({
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
    const review = await prisma.review.create({
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
    await updateProductAverageRating(productId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the review",
    });
  }
};

/**
 * Get all reviews for a specific product
 */
export const getProductReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
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
  } catch (error) {
    console.error("Error getting product reviews:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving reviews",
    });
  }
};

/**
 * Get all reviews by a specific user
 */
export const getUserReviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const reviews = await prisma.review.findMany({
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
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving reviews",
    });
  }
};

/**
 * Update an existing review
 */
export const updateReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user?.userId;

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
    const review = await prisma.review.findFirst({
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
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
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
    await updateProductAverageRating(review.productId);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the review",
    });
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    // Find the review and ensure it belongs to the user
    const review = await prisma.review.findFirst({
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
    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    // Update the product's average rating since a review was removed
    await updateProductAverageRating(review.productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the review",
    });
  }
};

/**
 * Check if user can review a specific product from a specific order
 */
export const canReviewProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId, orderId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    // Check if the user has purchased the product and the order status is DELIVERED
    const order = await prisma.order.findFirst({
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
    const existingReview = await prisma.review.findFirst({
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
  } catch (error) {
    console.error("Error checking if user can review product:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while checking if you can review the product",
    });
  }
};

/**
 * Get all reviews (admin only)
 */
export const getAllReviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
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
  } catch (error) {
    console.error("Error getting all reviews:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving reviews",
    });
  }
};

/**
 * Update a review (admin only)
 */
export const adminUpdateReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    const review = await prisma.review.findUnique({
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
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
      },
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
    await updateProductAverageRating(review.productId);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the review",
    });
  }
};

/**
 * Delete a review (admin only)
 */
export const adminDeleteReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;

    // Find the review
    const review = await prisma.review.findUnique({
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
    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    // Update the product's average rating since a review was removed
    await updateProductAverageRating(review.productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the review",
    });
  }
};

/**
 * Helper function to update product average rating
 */
async function updateProductAverageRating(productId: string) {
  try {
    // Calculate average rating for the product
    const ratings = await prisma.review.aggregate({
      where: {
        productId,
      },
      _avg: {
        rating: true,
      },
    });

    const avgRating = ratings._avg.rating;

    // Update the product's rating field
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        rating: avgRating,
      },
    });
  } catch (error) {
    console.error("Error updating product average rating:", error);
  }
}