import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import authController from '../controllers/authController.js';

const router = Router();
const auth = new authController();
const reviews = new ReviewController();

router
  .route('/')
  .get(reviews.getReviews)
  .post(auth.protect, reviews.createReview);

router.route('/tour/:tourId').get(reviews.getReviews);

export default router;
