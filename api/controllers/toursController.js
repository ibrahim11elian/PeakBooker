import TourModel from '../models/tourModel.js';
import { APIFeatures } from '../utils/api-features.js';
import AppError from '../utils/error.js';

export default class Tours {
  constructor() {}

  getTours = async (req, res, next) => {
    try {
      // create feature object to apply operations on mongoose query
      const features = new APIFeatures(TourModel.find(), req.query);

      // 1) Filter
      features.filter();

      // 2) Sort
      features.sort();

      // 3) Projection
      features.limitFields();

      // 4) Pagination
      features.paginate();

      // execute the query
      const numTours = await TourModel.countDocuments();
      const tours = await features.query;
      res.status(200).json({
        status: 'success',
        totalTours: numTours,
        results: tours.length,
        data: tours,
      });
    } catch (error) {
      next(error);
    }
  };

  createNewTour = async (req, res, next) => {
    try {
      const newTour = await TourModel.create(req.body);

      res.status(201).json({ status: 'success', data: newTour });
    } catch (error) {
      next(new AppError(error, 400));
    }
  };

  getTourByID = async (req, res, next) => {
    try {
      const { id } = req.params;

      const tour = await TourModel.findById(id).select('-__v');

      if (!tour) {
        return next(new AppError('tour not found!', 404));
      }

      res.status(200).json({ status: 'success', data: tour });
    } catch (error) {
      next(error);
    }
  };

  updateTour = async (req, res, next) => {
    try {
      const { id } = req.params;

      // the new option is to return the updated document
      const tour = await TourModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!tour) {
        return next(new AppError('tour not found!', 404));
      }

      res.status(200).json({ status: 'success', data: tour });
    } catch (error) {
      next(error);
    }
  };

  deleteTour = async (req, res, next) => {
    try {
      const { id } = req.params;
      const tour = await TourModel.findByIdAndDelete(id);

      if (!tour) {
        return next(new AppError('tour not found!', 404));
      }

      res
        .status(204)
        .json({ status: 'success', msg: 'tour deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

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

  // middleware will be added to the top 5 tours and update the req before calling the getTours function
  aliasTopTours = (req, _, next) => {
    // only add limit and sort to the req instead of change the whole req as may be the user add some filter or specify the fields to return
    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage';
    next();
  };
}
