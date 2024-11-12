import Joi from 'joi';

export default {
    create: Joi.object({
        name: Joi.string().min(1).max(50).required(),
        size: Joi.string().min(1).max(50).required(),
        price: Joi.string().min(1).max(50).required(),
        description: Joi.string().min(1).max(50).required(),
        brandName: Joi.string().min(1).max(50).required(),
        quantity: Joi.number().integer().positive().required(),
    }),

    getCards: Joi.object({
        page: Joi.number().integer().min(1).max(10000000).default(1).optional(),
        limit: Joi.number().integer().min(5).max(20).default(5).optional(),
    }),

    delete: Joi.object({
        id: Joi.number().integer().positive().required(),
    }),
};