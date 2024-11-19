import Products from "../models/Products.js"
import Reviews from "../models/Reviews.js";
import Users from '../models/Users.js';
import {Sequelize} from "sequelize";

export default {
    createReview: async (req, res) => {
        try {
            const { id: userId } = req.user;
            const { review, rating } = req.body;
            const { id: productId } = req.query;

            const product = await Products.findOne({
                where: { id: productId }
            });

            if (!product) {
                return res.status(404).json({ message: "product not found." });
            }

            const [reviews,created]= await Reviews.findOrCreate({
                where: { userId: userId, productId: productId },
                defaults:{
                    review:review,
                    rating:rating,
                    userid:userId,
                    productId:productId,
                }
            })

            if (!created) {
                return res.status(409).json({
                    message: 'You have already submitted a review for this product.',
                    product: product,
                    review: reviews
                });
            }

            res.status(201).json({
                message: 'Review created successfully',
                product: product,
                review: reviews
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while creating the review' });
        }
    },
    getReviews: async (req, res) => {
        try{

            const { productId } = req.query;

            if (!productId) {
                return res.status(400).json({
                    message: "Invalid request: productId is required."
                });
            }

            const product = await Products.findOne({
                where: { id: productId }
            });

            if (!product) {
                return res.status(404).json({ message: 'product not found' });
            }

            const productsReviews = await Reviews.findAll({
                where: { productId: productId },

                include: [
                    {
                        model: Products,
                    },
                    {
                        model: Users,
                        attributes: ['id', 'username']
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            const ratings = productsReviews.map(review => parseInt(review.rating, 10));
            const totalRatings = ratings.reduce((sum, rating) => sum + rating, 0);
            const averageRating = ratings.length > 0 ? totalRatings / ratings.length : null;

            res.status(200).json({
                message: 'Product reviews retrieved successfully',
                product,
                productsReviews,
                averageRating
            });
        }catch (error) {
            res.status(500).json({
                message: "An error occurred while retrieving reviews.",
                error: error.message
            });
        }
    },
    getReviewSummary:async(req, res) =>{
        const {userId} = req.params;

        try {
            const userExists = await Users.findByPk(userId);

            if (!userExists) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const reviewSummary = await Reviews.findOne({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalReviews'],
                    [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
                    [
                        Sequelize.fn(
                            'COUNT',
                            Sequelize.fn('DISTINCT', Sequelize.col('productId'))
                        ),
                        'totalProductsReviewed',
                    ],
                ],
                where: { userId },
            });

            if (!reviewSummary) {
                return res.status(404).json({
                    message: 'No reviews found for this user ',
                    reviewSummary: []
                });
            }

            return res.status(200).json({
                message: 'User review summary retrieved successfully.',
                reviewSummary: reviewSummary || { totalReviews: 0, averageRating: null, totalProductsReviewed: 0 },

            });
        } catch (error) {
            console.error('Error fetching review summary:', error);
            return res.status(500).json({
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    
}