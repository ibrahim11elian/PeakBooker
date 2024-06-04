import { Router } from 'express';
import Tours from '../controllers/toursController.js';
import AuthController from '../controllers/authController.js';
import reviewRouter from './reviews-routes.js';

const router = Router();

const tours = new Tours();
const auth = new AuthController();

// use the reviews routes to enable merging routes
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(tours.aliasTopTours, tours.getTours);

router.route('/stats').get(tours.getTourStats);

router
  .route('/busiest-month/:year')
  .get(auth.protect, auth.restrictTo('admin', 'guide'), tours.getMostBusyMonth);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tours.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tours.getDistances);

// Tours Routes
router
  .route('/')
  .get(tours.getTours)
  .post(
    auth.protect,
    auth.restrictTo('admin'),
    tours.uploadTourImages,
    tours.checkTour,
    tours.clearTourReq,
    tours.resizeTourImages,
    tours.handleTourImagesUpload,
    tours.parseFormData,
    tours.createNewTour,
  );

router
  .route('/:id')
  .get(tours.getTourByID)
  .put(
    auth.protect,
    auth.restrictTo('admin'),
    tours.uploadTourImages,
    tours.checkTour,
    tours.clearTourReq,
    tours.resizeTourImages,
    tours.handleTourImagesUpload,
    tours.parseFormData,
    tours.updateTour,
  )
  .delete(auth.protect, auth.restrictTo('admin'), tours.deleteTour);

export default router;
