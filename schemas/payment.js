import Joi from 'joi';

export default {
	create: Joi.object({
		productId: Joi.number().strict().required(),
		price: Joi.number().strict().required(),
	}),
};
