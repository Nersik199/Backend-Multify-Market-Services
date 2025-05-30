import { Router } from 'express';

import controller from '../controllers/controllers.Cards.js';

import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';

import cardsSchema from '../schemas/cards.js';
const router = Router();

router.post(
	'/create',
	checkToken,
	validate(cardsSchema.create, 'body'),
	controller.create
);

router.get(
	'/list',
	checkToken,
	validate(cardsSchema.getCards, 'query'),
	controller.getCards
);

router.put(
	'/update/:cardId',
	checkToken,
	validate(cardsSchema.update, 'body'),
	controller.update
);

router.delete(
	'/delete/:cardId',
	checkToken,
	validate(cardsSchema.delete, 'params'),
	controller.delete
);
router.delete('/all', checkToken, controller.deleteAll);

export default router;
