import { Router } from 'express';

import controllers from '../controllers/controllers.Product.js';
import validate from '../middleware/validate.js';

import productSchema from '../schemas/product.js';

const router = Router();

router.get('/stores', controllers.getStores);
router.get(
	'/list',
	validate(productSchema.getProducts, 'query'),
	controllers.getProducts
);
router.get('/search', controllers.searchProduct);
router.get('/popular', controllers.getMostPopularProducts);
router.get('/:id', controllers.getProductById);
router.get(
	'/list/:categoryId',
	validate(productSchema.getProducts, 'query'),
	controllers.getProductsByCategory
);
router.get('/store/:storeId', controllers.getStoreAndProduct);

export default router;
