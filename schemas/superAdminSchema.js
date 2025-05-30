import Joi from 'joi';

export default {
	createStore: Joi.object({
		name: Joi.string().required(),
		location: Joi.object({
			city: Joi.string().required(),
			country: Joi.string().required(),
			latitude: Joi.number().required(),
			longitude: Joi.number().required(),
		}).required(),
		webSiteUrl: Joi.string().min(10).max(200).required(),
		videoUrl: Joi.string().min(10).max(200).required(),
		about: Joi.string().required(),
	}),

	setupUserStore: Joi.object({
		email: Joi.string().required(),
		storeId: Joi.number().required(),
	}),

	updateStore: Joi.object({
		name: Joi.string().optional(),
		location: Joi.object({
			city: Joi.string().optional(),
			country: Joi.string().optional(),
			latitude: Joi.number().optional(),
			longitude: Joi.number().optional(),
		}).optional(),
		about: Joi.string().optional(),
		webSiteUrl: Joi.string().min(10).max(200).optional(),
		videoUrl: Joi.string().min(10).max(200).optional(),
	}),

	removeAdmin: Joi.object({
		adminId: Joi.number().required(),
		storeId: Joi.number().required(),
	}),

	getAllUser: Joi.object({
		role: Joi.string().valid('admin', 'user').optional(),
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).default(50),
	}),
};
