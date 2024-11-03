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

	setupUserStore: Joi.object({
		email: Joi.string().required(),
		storeName: Joi.string().required(),
	}),
};
