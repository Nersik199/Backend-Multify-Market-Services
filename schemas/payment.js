import Joi from 'joi';

export default {
	create: Joi.object({
		products: Joi.array()
			.items(
				Joi.object({
					productId: Joi.number().strict().required(),
					quantity: Joi.number().strict().min(1).required(),
				})
			)
			.min(1)
			.required(),
	}),

	retry: Joi.object({ paymentId: Joi.number().strict().required() }),
};
