import Joi from 'joi';

export default {
	createReview: Joi.object({
		review: Joi.string().required(),
		rating: Joi.number().required().min(1).max(5),
	}),
};
