import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import authController from '../controllers/authController.js';

const router = Router({
  mergeParams: true,
});

const auth = new authController();
const reviews = new ReviewController();

router.use(auth.protect);

router
  .route('/')
  .get(reviews.aliasGetTourReviews, reviews.getReviews)
  .post(
    auth.restrictTo('user'),
    reviews.setTourAndUserIds,
    reviews.createReview,
  );

router
  .route('/:id')
  .get(reviews.getReviewById)
  .patch(
    auth.restrictTo('user', 'admin'),
    reviews.checkReviewOwner,
    reviews.updateReview,
  )
  .delete(
    auth.restrictTo('user', 'admin'),
    reviews.checkReviewOwner,
    reviews.deleteReview,
  );

export default router;
