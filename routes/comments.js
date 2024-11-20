import { Router } from 'express';

//Controllers
import controllers from '../controllers/controllers.Comments.js';
//Middleware
import checkToken from '../middleware/checkToken.js';
//Schemas
import commentSchema from '../schemas/comments.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
	'/add/:reviewId',
	checkToken,
	validate(commentSchema.addComment, 'body'),
	controllers.addComments
);
router.get('/list/:reviewId', controllers.getComments);

export default router;
