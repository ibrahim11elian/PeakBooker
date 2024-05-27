import { Router } from 'express';
import Tours from '../controllers/toursController.js';
import AuthController from '../controllers/authController.js';
import reviewRouter from './reviews-routes.js';

const router = Router();

const tours = new Tours();
const auth = new AuthController();

router.use('/:tourId/reviews', reviewRouter);

// Tours Routes
router
  .route('/')
  .all(auth.protect)
  .get(tours.getTours)
  .post(auth.restrictTo('admin'), tours.createNewTour);

router.route('/top-5-cheap').get(tours.aliasTopTours, tours.getTours);

router.route('/stats').get(tours.getTourStats);

router.route('/busiest-month/:year').get(tours.getMostBusyMonth);

router
  .route('/:id')
  .get(tours.getTourByID)
  .put(tours.updateTour)
  .delete(auth.protect, auth.restrictTo('admin'), tours.deleteTour);

export default router;
