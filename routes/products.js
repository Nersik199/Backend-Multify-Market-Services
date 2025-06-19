import { Router } from 'express';
import cron from 'node-cron';

import controllers from '../controllers/controllers.Product.js';
import validate from '../middleware/validate.js';
import productSchema from '../schemas/product.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = Router();

router.get('/stores', controllers.getStores);
router.get(
	'/list',
	optionalAuth,
	validate(productSchema.searchAndFilterProducts, 'query'),
	controllers.searchAndFilterProducts
);
router.get('/popular', optionalAuth, controllers.getMostPopularProducts);
router.get('/discounts', optionalAuth, controllers.getDiscounts);
router.get(
	'/:id',
	optionalAuth,
	validate(productSchema.getProductById, 'query'),
	controllers.getProductById
);
router.get(
	'/list/:categoryId',
	validate(productSchema.getProductsByCategory, 'query'),
	controllers.getProductsByCategory
);

router.get('/store/information/:id', controllers.getStoreById);

cron.schedule('*/40 * * * *', async () => {
	try {
		await controllers.removeExpiredDiscounts();
	} catch (error) {
		console.error('[CRON] Error removing expired discounts:', error);
	}
});

export default router;
