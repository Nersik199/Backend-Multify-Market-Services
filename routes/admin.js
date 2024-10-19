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
router.post(
	'/product',
	checkToken,
	uploadFile('Product').array('productImage', 5),
	validate(adminSchema.createProduct, 'body'),
	controllers.createProduct
);

export default router;
