import { Router } from 'express';

import controllers from '../controllers/controllers.Admin.js';
import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';
import uploadFile from '../middleware/uploadFile.js';

const router = Router();

router.get('/create', controllers.adimin);

export default router;
