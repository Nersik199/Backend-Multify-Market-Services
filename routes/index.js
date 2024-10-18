import { Router } from 'express';

import admin from './admin.js';
import users from './users.js';
const router = Router();

router.use('/users', users);
router.use('/admin', admin);

router.get('/home', (req, res) => {
	res.render('index');
});
export default router;
