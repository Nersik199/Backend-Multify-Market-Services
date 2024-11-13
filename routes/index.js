import { Router } from 'express';

//routes
import superAdmin from './superAdmin.js';
import admin from './admin.js';
import users from './users.js';
import cards from './cards.js';
const router = Router();

router.use('/superAdmin', superAdmin);
router.use('/users', users);
router.use('/admin', admin);
router.use('/cards', cards);

router.get('/home', (req, res) => {
	res.render('index');
});
export default router;
