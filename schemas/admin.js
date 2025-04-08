import Joi from 'joi';

export default {
	createProduct: Joi.object({
		name: Joi.string().required(),
		size: Joi.string().required(),
		price: Joi.number().required().positive(),
		description: Joi.string().max(200).min(10).required(),
		brandName: Joi.string().required(),
		productImage: Joi.string().optional(),
		quantity: Joi.number().required(),
	}),

	updateProduct: Joi.object({
		imageId: Joi.string().optional(),
		name: Joi.string().required(),
		size: Joi.string().required(),
		price: Joi.number().required().positive(),
		description: Joi.string().max(200).min(10).required(),
		brandName: Joi.string().required(),
		quantity: Joi.number().required(),
	}),

	discountSchema: Joi.object({
		productId: Joi.number().integer().positive().required(),
		discountPercentage: Joi.number().positive().max(100).required(),
		startDate: Joi.date().greater('now').required(),
		endDate: Joi.date().greater(Joi.ref('startDate')).required(),
	}),

	createReply: Joi.object({
		reviewId: Joi.number().integer().positive().required(),
		reply: Joi.string().required(),
	}),

	getStatistics: Joi.object({
		startDate: Joi.date().iso().optional(),
		endDate: Joi.date().iso().optional(),
		groupBy: Joi.string().valid('day', 'month', 'year').optional(),
	}),

	getBuyers: Joi.object({
		startDate: Joi.date().iso().optional(),
		endDate: Joi.date().iso().optional(),
	}),
};
