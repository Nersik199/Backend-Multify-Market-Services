import Joi from 'joi';

export default {
	addComment: Joi.object({
		comment: Joi.string().min(3).max(50).required(),
	}),
};
