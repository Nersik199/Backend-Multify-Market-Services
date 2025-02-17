import { Router } from 'express';
import checkToken from '../middleware/checkToken.js';
import controllers from '../controllers/controllers.payment.js';
const router = Router();

router.post('/place', checkToken, controllers.payment);
router.post('/webhook/yookassa', controllers.getEvent);
router.get('/history', checkToken, controllers.getUserPayments);

export default router;
