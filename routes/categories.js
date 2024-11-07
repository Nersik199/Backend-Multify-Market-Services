import { Router } from 'express';

import controllers from '../controllers/controllers.Category.js';

const router = Router();

router.get('/list',  controllers.getAllCategories);


export default router;
