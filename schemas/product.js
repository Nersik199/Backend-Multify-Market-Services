import Joi from 'joi';

export default {
	getProductsByCategory: Joi.object({
		page: Joi.number().integer().min(1).max(10000000).default(1).optional(),
		limit: Joi.number().integer().min(5).max(100).default(5).optional(),
		maxPrice: Joi.number().integer().min(0).max(10000000).optional(),
		minPrice: Joi.number().integer().min(0).max(10000000).optional(),
	}),

	getProductById: Joi.object({
		userId: Joi.number().integer().optional(),
	}),

	searchAndFilterProducts: Joi.object({
		page: Joi.number().integer().min(1).max(10000000).default(1).optional(),
		limit: Joi.number().integer().min(5).max(100).default(5).optional(),
		maxPrice: Joi.number().integer().min(0).max(10000000).optional(),
		minPrice: Joi.number().integer().min(0).max(10000000).optional(),
		storeId: Joi.number().integer().optional(),
		categoryIds: Joi.string().optional(),
		s: Joi.string().optional(),
	}),
};
