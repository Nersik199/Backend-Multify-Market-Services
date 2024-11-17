import { Router } from 'express';

//routes
import superAdmin from './superAdmin.js';
import admin from './admin.js';
import users from './users.js';
import products from './products.js';
import categories from './categories.js';

const router = Router();

router.use('/superAdmin', superAdmin);
router.use('/users', users);
router.use('/admin', admin);
router.use('/products', products);
router.use('/categories', categories);

router.get('/', (req, res) => {
	res.render('index');
});
export default router;
