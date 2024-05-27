import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import authController from '../controllers/authController.js';

const router = Router({
  mergeParams: true,
});

const auth = new authController();
const reviews = new ReviewController();

router
  .route('/')
  .get(reviews.aliasGetTourReviews, reviews.getReviews)
  .post(auth.protect, reviews.setTourAndUserIds, reviews.createReview);

router
  .route('/:id')
  .get(auth.protect, reviews.getReviewById)
  .patch(auth.protect, reviews.updateReview)
  .delete(auth.protect, reviews.deleteReview);

export default router;
