import Joi from 'joi';

export default {
	createStore: Joi.object({
		name: Joi.string().required(),
		location: Joi.object().required(),
	}),
	createProduct: Joi.object({
		name: Joi.string().required(),
		size: Joi.string().required(),
		price: Joi.number().required().positive(),
		description: Joi.string().required(),
		category: Joi.string().required(),
	}),
};
