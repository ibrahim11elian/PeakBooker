import TourModel from '../models/tourModel.js';
import BaseController from './baseController.js';

class Tours extends BaseController {
  constructor() {
    super(TourModel);
  }

  getTours = this.getAll;

  createNewTour = this.createOne;

  getTourByID = this.getOne('reviews');

  updateTour = this.updateOne;

  deleteTour = this.deleteOne;

  getTourStats = async (req, res, next) => {
    try {
      const stats = await TourModel.aggregate([
        {
          $group: {
            _id: { $toUpper: '$difficulty' },
            totalTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            maxDuration: { $max: '$duration' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: { avgPrice: 1 },
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getMostBusyMonth = async (req, res, next) => {
    try {
      const { year } = req.params;
      const busiestMonth = await TourModel.aggregate([
        {
          $match: {
            startDates: {
              $elemMatch: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
              },
            },
          },
        },
        {
          $unwind: '$startDates',
        },
        {
          $group: {
            _id: { $month: '$startDates' },
            totalTours: { $sum: 1 },
            tours: { $push: { _id: '$_id', name: '$name' } },
          },
        },
        { $sort: { numTours: -1 } },
        { $limit: 1 },
        {
          $addFields: {
            month: '$_id',
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: busiestMonth,
      });
    } catch (error) {
      next(error);
    }
  };

  aliasTopTours = (req, _, next) => {
    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage';
    next();
  };
}

export default Tours;
