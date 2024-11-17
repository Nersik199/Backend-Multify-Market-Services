import { Router } from 'express';

import controllers from '../controllers/controllers.Product.js';

const router = Router();

router.get('/stores', controllers.getStores);
router.get('/list', controllers.getProducts);
router.get('/list/:categoryId', controllers.getProductsByCategory);
router.get('/store/:storeId', controllers.getStoreAndProduct);
router.get('/search', controllers.searchProduct);

export default router;
