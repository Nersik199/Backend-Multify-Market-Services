import { Router } from 'express';
import checkToken from '../middleware/checkToken.js';
import controllers from '../controllers/controllers.Payment.js';
const router = Router();

import validate from '../middleware/validate.js';
import paymentSchema from '../schemas/payment.js';

router.post(
	'/place',
	checkToken,
	validate(paymentSchema.create, 'body'),
	controllers.payment
);
router.post(
	'/retry',
	checkToken,
	validate(paymentSchema.retry, 'body'),
	controllers.retryPayment
);

router.post(
	'/confirm-receipt',
	validate(paymentSchema.confirmReceipt, 'body'),
	checkToken,
	controllers.confirmReceipt
);

router.post('/webhook/yookassa', controllers.getEvent);
router.get('/history', checkToken, controllers.getUserPayments);
router.get('/received', checkToken, controllers.getReceivedPayments);

export default router;
