import { Router } from 'express';

import controllers from '../controllers/controllers.Users.js';

import checkToken from '../middleware/checkToken.js';
import validate from '../middleware/validate.js';
import uploadFile from '../middleware/uploadFile.js';

import userSchema from '../schemas/users.js';
const router = Router();

router.post(
	'/registration',
	uploadFile('avatar').single('avatar'),
	validate(userSchema.registration, 'body'),
	controllers.registration
);

router.post('/login', validate(userSchema.login, 'body'), controllers.login);
router.get('/profile', checkToken, controllers.profile);

router.post(
	'/activate',
	validate(userSchema.activeAccount, 'body'),
	controllers.activeAccount
);

router.put(
	'/update',
	uploadFile('avatar').single('avatar'),
	validate(userSchema.userUpdate, 'body'),
	checkToken,
	controllers.updateProfile
);
export default router;
