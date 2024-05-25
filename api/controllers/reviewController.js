import ReviewModel from '../models/reviewModel.js';
import { APIFeatures } from '../utils/api-features.js';

export class ReviewController {
  constructor() {}
  async getReviews(req, res, next) {
    try {
      // create feature object to apply operations on mongoose query
      const features = new APIFeatures(ReviewModel.find(), req.query);

      // 1) Filter
      features.filter();

      // 2) Sort
      features.sort();

      // 3) Projection
      features.limitFields();

      // 4) Pagination
      features.paginate();

      // execute the query
      const numReviews = await ReviewModel.countDocuments();
      const reviews = await features.query;

      res.status(200).json({
        status: 'success',
        totalReviews: numReviews,
        results: reviews.length,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }
  async createReview(req, res, next) {
    try {
      if (!req.body.tour) req.body.tour = req.params.tourId;
      if (!req.body.user) req.body.user = req.user.id;

      const newReview = await ReviewModel.create(req.body);

      res.status(201).json({
        status: 'success',
        data: newReview,
      });
    } catch (error) {
      next(error);
    }
  }
}
