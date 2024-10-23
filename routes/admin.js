import { Router } from 'express';

import controllers from '../controllers/controllers.Admin.js';

import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';
import uploadFile from '../middleware/uploadFile.js';

import adminSchema from '../schemas/admin.js';
const router = Router();

router.post(
	'/store',
	checkToken,
	uploadFile('Store').single('logo'),
	validate(adminSchema.createStore, 'body'),
	controllers.createStore
);
router.get('/categories', checkToken, controllers.getCategories);

router.post(
	'/product/:categoryId',
	checkToken,
	uploadFile('Product').array('productImage', 5),
	validate(adminSchema.createProduct, 'body'),
	controllers.createProduct
);

router.get('/products', checkToken, controllers.getAllProducts);
router.get('/products/:categoryId', checkToken, controllers.getProducts);

router.put(
	'/product/:productId',
	checkToken,
	uploadFile('Product').array('productImage', 5),
	validate(adminSchema.updateProduct, 'body'),
	controllers.updateProduct
);

router.delete('/product/:productId', checkToken, controllers.deleteProduct);
router.delete('/image/:imageId', checkToken, controllers.delateImage);
export default router;
