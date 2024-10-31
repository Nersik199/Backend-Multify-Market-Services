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
	}),
	createProduct: Joi.object({
		name: Joi.string().required(),
		size: Joi.string().required(),
		price: Joi.number().required().positive(),
		description: Joi.string().required(),
		brandName: Joi.string().required(),
		productImage: Joi.string().optional(),
	}),

	updateProduct: Joi.object({
		imageId: Joi.string().optional(),
		name: Joi.string().required(),
		size: Joi.string().required(),
		price: Joi.number().required().positive(),
		description: Joi.string().required(),
		brandName: Joi.string().required(),
	}),
};
