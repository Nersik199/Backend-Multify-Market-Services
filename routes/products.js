import { Router } from 'express';
import cron from 'node-cron';

import controllers from '../controllers/controllers.Product.js';
import validate from '../middleware/validate.js';

import productSchema from '../schemas/product.js';

const router = Router();

router.get('/stores', controllers.getStores);
router.get(
	'/list',
	validate(productSchema.getProductsSearch, 'query'),
	controllers.searchProduct
);
router.get('/popular', controllers.getMostPopularProducts);
router.get('/discounts', controllers.getDiscounts);
router.get(
	'/:id',
	validate(productSchema.getProductById, 'query'),
	controllers.getProductById
);
router.get(
	'/list/:categoryId',
	validate(productSchema.getProductsByCategory, 'query'),
	controllers.getProductsByCategory
);

cron.schedule('0 0 * * *', async () => {
	try {
		await controllers.removeExpiredDiscounts();
	} catch (error) {
		console.error('[CRON] Error removing expired discounts:', error);
	}
});

// router.get('/store/:storeId', controllers.getStoreAndProduct);

// router.get(
// 	'/list',
// 	validate(productSchema.getProducts, 'query'),
// 	controllers.getProducts
// );
export default router;
