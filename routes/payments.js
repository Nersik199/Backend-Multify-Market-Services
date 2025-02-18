import { Router } from 'express';
import checkToken from '../middleware/checkToken.js';
import controllers from '../controllers/controllers.payment.js';
const router = Router();

import validate from '../middleware/validate.js';
import paymentSchema from '../schemas/payment.js';

router.post(
	'/place',
	checkToken,
	validate(paymentSchema.create, 'body'),
	controllers.payment
);
router.post('/webhook/yookassa', controllers.getEvent);
router.get('/history', checkToken, controllers.getUserPayments);

export default router;
