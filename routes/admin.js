import { Router } from 'express';
import controllers from '../controllers/controllers.Admin.js';
import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';
import uploadFile from '../middleware/uploadFile.js';
import adminSchema from '../schemas/admin.js';

const router = Router();
router.get('/categories', checkToken, controllers.getCategories);

router.post(
	'/product/:categoryId',
	checkToken,
	uploadFile('Product').array('productImage', 5),
	validate(adminSchema.createProduct, 'body'),
	controllers.createProduct
);

router.post(
	'/review/reply',
	checkToken,
	validate(adminSchema.createReply, 'body'),
	controllers.createReply
);

router.get('/products', checkToken, controllers.getAllProducts);
router.get('/products/:categoryId', checkToken, controllers.getProducts);
router.get('/product/:productId', checkToken, controllers.getProductById);

router.put(
	'/product/:productId',
	checkToken,
	uploadFile('Product').array('productImage', 5),
	validate(adminSchema.updateProduct, 'body'),
	controllers.updateProduct
);
router.get('/search', checkToken, controllers.searchStoreProduct);

router.post(
	'/discount',
	checkToken,
	validate(adminSchema.discountSchema, 'body'),
	controllers.discount
);

router.delete('/product/:productId', checkToken, controllers.deleteProduct);
router.delete('/image/:imageId', checkToken, controllers.delateImage);
router.get(
	'/statistics',
	checkToken,
	validate(adminSchema.getStatistics, 'query'),
	controllers.getStatistics
);

router.get(
	'/buyers',
	checkToken,
	validate(adminSchema.getBuyers, 'query'),
	controllers.getBuyers
);
export default router;
