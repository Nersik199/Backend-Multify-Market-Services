import Joi from 'joi';

export default {
	create: Joi.object({
		productId: Joi.number().integer().positive().required(),
		quantity: Joi.number().integer().positive().required(),
	}),

	update: Joi.object({
		add: Joi.number().integer().positive().optional(),
		remove: Joi.number().integer().positive().optional(),
	}),

	getCards: Joi.object({
		page: Joi.number().integer().min(1).max(10000000).default(1).optional(),
		limit: Joi.number().integer().min(5).max(100).default(5).optional(),
	}),

	delete: Joi.object({
		cardId: Joi.number().integer().positive().required(),
	}),
};
