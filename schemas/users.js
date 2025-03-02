import Joi from 'joi';

export default {
	registration: Joi.object({
		firstName: Joi.string().min(3).max(50).required(),
		lastName: Joi.string().min(3).max(50).required(),
		email: Joi.string().email().required(),
		password: Joi.string().min(3).max(50).required(),
		gender: Joi.string().min(3).max(50).required(),
		dateOfBirth: Joi.date().required(),
	}),
	activeAccount: Joi.object({
		key: Joi.string().max(6).required(),
	}),

	login: Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
	}),

	userUpdate: Joi.object({
		firstName: Joi.string().min(3).max(50).required(),
		lastName: Joi.string().min(3).max(50).required(),
		gender: Joi.string().min(3).max(50).required(),
		dateOfBirth: Joi.date().required(),
	}),

	changePassword: Joi.object({
		newPassword: Joi.string().min(3).max(50).required(),
	}),

	updatePassword: Joi.object({
		newPassword: Joi.string().min(3).max(50).required(),
		key: Joi.string().min(3).max(6).required(),
	}),

	resetActivationKey: Joi.object({
		email: Joi.string().email().required(),
	}),

	forgotPassword: Joi.object({
		email: Joi.string().email().min(3).max(50).required(),
	}),

	resendCode: Joi.object({
		email: Joi.string().email().min(3).max(50).required(),
	}),

	delateUser: Joi.object({
		email: Joi.string().email().min(3).max(50).required(),
	}),
};
