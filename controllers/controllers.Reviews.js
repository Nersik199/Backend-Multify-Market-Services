import Products from "../models/Products.js";
import Reviews from "../models/Reviews.js";
import Users from "../models/Users.js";
import ReviewReplies from "../models/ReviewReplies.js";
import { Sequelize } from "sequelize";
import Photo from "../models/Photo.js";
import Payments from "../models/Payments.js";
import StoreAdmin from "../models/StoreAdmin.js";
import notification from "../socket/notificationService.js";
export default {
  createReview: async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { review, rating } = req.body;
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          message: "Invalid request: productId is required.",
        });
      }

      const product = await Products.findOne({
        where: { id: productId },
        include: [
          {
            model: Photo,
            as: "productImage",
            attributes: ["id", "path"],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({ message: "product not found." });
      }

      const [reviews, created] = await Reviews.findOrCreate({
        where: { userId, productId },
        defaults: {
          review,
          rating,
          userId,
          productId,
        },
      });

      if (!created) {
        res.status(409).json({
          message: "You have already submitted a review for this product.",
          product: product,
          review: reviews,
        });
        return;
      }

      const productData = {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        path: product.productImage?.[0]?.path || null,
      };

      const storeAdmin = await StoreAdmin.findAll({
        where: { storeId: product.storeId },
      });

      if (storeAdmin) {
        notification.sendNewReviewNotification(
          storeAdmin,
          reviews,
          productData
        );
      }

      res.status(201).json({
        message: "Review created successfully",
        product: product,
        review: reviews,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the review" });
    }
  },

  getReviews: async (req, res) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          message: "Invalid request: productId is required.",
        });
      }

      const product = await Products.findOne({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: "product not found" });
      }

      const productsReviews = await Reviews.findAll({
        where: { productId },
        include: [
          {
            model: Users,
            attributes: ["id", "firstName", "lastName", "email"],
            include: [
              {
                model: Photo,
                as: "avatar",
                attributes: ["id", "path"],
              },
            ],
          },
          {
            model: ReviewReplies,
            attributes: ["id", "reply", "createdAt"],
            include: [
              {
                model: Users,
                attributes: ["id", "firstName", "lastName"],
                include: [
                  {
                    model: Photo,
                    as: "avatar",
                    attributes: ["id", "path"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      if (productsReviews.length === 0) {
        res.status(404).json({ message: "No reviews found" });
        return;
      }

      const ratings = productsReviews.map((review) =>
        parseInt(review.rating, 10)
      );
      const totalRatings = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        ratings.length > 0 ? totalRatings / ratings.length : null;

      res.status(200).json({
        message: "Product reviews retrieved successfully",
        productsReviews,
        averageRating,
      });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred while retrieving reviews.",
        error: error.message,
      });
    }
  },

  getReviewSummary: async (req, res) => {
    const { productId } = req.params;
    try {
      const productExists = await Reviews.findOne({
        where: { productId },
      });

      if (!productExists) {
        return res.status(404).json({
          message: "Product not found",
        });
        totalReviews;
      }

      const reviewSummary = await Reviews.findOne({
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("id")), "totalReviews"],
          [Sequelize.fn("AVG", Sequelize.col("rating")), "averageRating"],
          [
            Sequelize.fn(
              "COUNT",
              Sequelize.fn("DISTINCT", Sequelize.col("productId"))
            ),
            "totalProductsReviewed",
          ],
        ],
        where: { productId },
      });

      if (!reviewSummary) {
        return res.status(404).json({
          message: "Review summary not found",
          reviewSummary: [],
        });
      }

      res.status(200).json({
        message: "Review summary retrieved successfully",
        reviewSummary: reviewSummary || {
          totalReviews: 0,
          averageRating: null,
          totalProductsReviewed: 0,
        },
      });
    } catch (error) {
      console.error("Error fetching review summary:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  getRandomReviews: async (req, res) => {
    try {
      const limit = 5;

      const randomReviews = await Reviews.findAll({
        attributes: ["id", "review", "rating", "createdAt"],
        include: [
          {
            model: Users,
            attributes: ["id", "firstName", "lastName", "email"],
            include: [
              {
                model: Photo,
                as: "avatar",
                attributes: ["id", "path"],
              },
            ],
          },
          {
            model: Products,
            attributes: ["id", "name"],
            include: [
              {
                model: Photo,
                as: "productImage",
                attributes: ["id", "path"],
              },
            ],
          },
        ],
        order: Sequelize.literal("RAND()"),
        limit: limit,
      });

      if (randomReviews.length === 0) {
        return res.status(404).json({ message: "No reviews found" });
      }

      res.status(200).json({
        message: "Random reviews retrieved successfully",
        randomReviews,
      });
    } catch (error) {
      console.error("Error fetching random reviews:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  getReviewByPayment: async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          message: "Invalid request: paymentId is required.",
        });
      }

      const payment = await Payments.findOne({
        where: { id: paymentId, userId },
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      const review = await Reviews.findOne({
        where: { productId: payment.productId, userId },
        attributes: ["id", "review", "rating", "createdAt"],
        include: [
          {
            model: Products,
            as: "product",
            attributes: ["id", "name", "description"],
            include: [
              {
                model: Photo,
                as: "productImage",
                attributes: ["id", "path"],
              },
            ],
          },
          {
            model: Users,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email"],
            include: [
              {
                model: Photo,
                as: "avatar",
                attributes: ["id", "path"],
              },
            ],
          },
        ],
      });

      if (!review) {
        return res.status(404).json({
          message: "No reviews found for this payment",
          review: [],
        });
      }

      const productImage = review.product.productImage
        ? review.product.productImage.length > 0
          ? review.product.productImage.map((image) => ({
              id: image.id,
              path: image.path,
            }))
          : null
        : null;

      return res.status(200).json({
        message: "Review retrieved successfully",
        review: {
          id: review.id,
          review: review.review,
          rating: review.rating,
          createdAt: review.createdAt,
          product: {
            id: review.product.id,
            name: review.product.name,
            description: review.product.description,
            productImage,
          },
          user: {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            email: review.user.email,
            avatar:
              review.user.avatar.length > 0 ? review.user.avatar[0].path : null,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching review by payment:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};
