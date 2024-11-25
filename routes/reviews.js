import { Router } from 'express';

//Controllers
import controllers from '../controllers/controllers.Reviews.js';
//Middleware
import checkToken from '../middleware/checkToken.js';
//Schemas
import validate from '../middleware/validate.js';
import reviewSchema from '../schemas/reviews.js';

const router = Router();

router.post(
	'/create/:productId',
	checkToken,
	validate(reviewSchema.createReview, 'body'),
	controllers.createReview
);

router.get('/list/:productId', controllers.getReviews);
router.get('/summary/:userId', controllers.getReviewSummary);

export default router;
