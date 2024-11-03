import { Router } from 'express';

import controllers from '../controllers/controllers.SuperAdmin.js';

import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';
import uploadFile from '../middleware/uploadFile.js';

import superAdminSchema from '../schemas/superAdminSchema.js';

const router = Router();

router.post(
	'/stores/create',
	checkToken,
	uploadFile('Store').single('logo'),
	validate(superAdminSchema.createStore, 'body'),
	controllers.createStore
);

router.get('/stores', checkToken, controllers.getStores);

router.post(
	'/stores/assign-user',
	checkToken,
	validate(superAdminSchema.setupUserStore, 'body'),
	controllers.setupUserStore
);

export default router;
