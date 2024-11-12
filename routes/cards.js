import { Router } from 'express';

import controller from '../controllers/controllers.Cards.js';

import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';

import cardsSchema from '../schemas/cards.js';
const router = Router();

router.post(
    '/create',
    validate(cardsSchema.create, 'body'),
    controller.create
);

router.get(
    '/list',
    checkToken,
    validate(cardsSchema.getCards, 'query'),
    controller.getCards
);

router.delete(
    '/delete/:cardId',
    checkToken,
    validate(cardsSchema.delete, 'params'),
    controller.delete
);
