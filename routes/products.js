import { Router } from 'express';
import cron from 'node-cron';

import controllers from '../controllers/controllers.Product.js';
import validate from '../middleware/validate.js';

import productSchema from '../schemas/product.js';

const router = Router();

router.get('/stores', controllers.getStores);
router.get(
	'/list',
	validate(productSchema.searchAndFilterProducts, 'query'),
	controllers.searchAndFilterProducts
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

router.get('/store/information/:id', controllers.getStoreById);

cron.schedule('0 0 * * *', async () => {
	try {
		await controllers.removeExpiredDiscounts();
	} catch (error) {
		console.error('[CRON] Error removing expired discounts:', error);
	}
});

export default router;
