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
router.get('/statistics/:storeId', checkToken, controllers.getStatistics);
router.get('/stores/:storeId/buyers', checkToken, controllers.getBuyers);
router.delete('/stores/:storeId', checkToken, controllers.deleteStore);
router.put(
	'/stores/:storeId',
	checkToken,
	uploadFile('Store').single('logo'),
	validate(superAdminSchema.updateStore, 'body'),
	controllers.updateStore
);
router.get('/stores/admins/:storeId', checkToken, controllers.getAdminStore);
router.put(
	'/remove-admin',
	checkToken,
	validate(superAdminSchema.removeAdmin, 'body'),
	controllers.updateAdminInUser
);

router.get(
	'/stores/all-statistics',
	checkToken,
	controllers.getAllStoresStatistics
);

router.get(
	'/all-users',
	checkToken,
	validate(superAdminSchema.getAllUser, 'query'),
	controllers.getAllUsers
);

router.post(
	'/create-category',
	checkToken,
	uploadFile('Categories').single('categoryImage'),
	controllers.createCategory
);
router.delete(
	'/delete-category/:categoryId',
	checkToken,
	controllers.delateCategory
);
export default router;
