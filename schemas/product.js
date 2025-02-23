import Joi from 'joi';

export default {
	getProducts: Joi.object({
		page: Joi.number().integer().min(1).max(10000000).default(1).optional(),
		limit: Joi.number().integer().min(5).max(100).default(5).optional(),
		maxPrice: Joi.number().integer().min(0).max(10000000).optional(),
		minPrice: Joi.number().integer().min(0).max(10000000).optional(),
	}),
};
