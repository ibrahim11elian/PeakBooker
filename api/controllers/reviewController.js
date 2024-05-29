import ReviewModel from '../models/reviewModel.js';
import AppError from '../utils/error.js';
import BaseController from './baseController.js';

export class ReviewController extends BaseController {
  constructor() {
    super(ReviewModel);
  }

  setTourAndUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
  };

  aliasGetTourReviews = (req, res, next) => {
    // this if the user tries to get a specific tour reviews
    // a middleware to manipulate the query to that will be handled on the get all (APIFeatures)
    if (req.params.tourId) {
      req.query.tour = req.params.tourId;
    }
    next();
  };

  checkReviewOwner = async (req, res, next) => {
    // NOT FINISHED!
    // middleware to check if the user performing update or delete on review is the owner of the review or not
    const review = await this.model.findById(req.params.id);
    if (!review) return next(new AppError('No review found with that ID', 404));
    if (review.user.id.toString() !== req.user.id.toString()) {
      return next(
        new AppError('You are not authorized to perform this action', 403),
      );
    }
    next();
  };

  createReview = this.createOne;
  getReviews = this.getAll;
  getReviewById = this.getOne();

  updateReview = this.updateOne;
  deleteReview = this.deleteOne;
}
