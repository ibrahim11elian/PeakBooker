import ReviewModel from '../models/reviewModel.js';
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

  createReview = this.createOne;
  getReviews = this.getAll;
  getReviewById = this.getOne();

  updateReview = this.updateOne;
  deleteReview = this.deleteOne;
}
