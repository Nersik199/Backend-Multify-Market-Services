import { Router } from 'express';

import controllers from '../controllers/controllers.Product.js';

const router = Router();

router.get('/list',  controllers.getProducts);


export default router;
