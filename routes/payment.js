import { Router } from 'express';
import paymentController from '../controllers/controllers.Payment.js';
import checkToken from '../middleware/checkToken.js';

const router = Router();

router.post('/payment-intents', checkToken, paymentController.createPaymentIntent);

export default router;