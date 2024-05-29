import TourModel from '../models/tourModel.js';
import AppError from '../utils/error.js';
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

  getToursWithin = async (req, res, next) => {
    try {
      const { distance, latlng, unit } = req.params;
      const [lat, lng] = latlng.split(',');

      // mongo spacial wants the distance divided by the radius of the earth
      const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
      if (!lat || !lng || !distance) {
        next(
          new AppError(
            'Please provide latitude, longitude, and distance in the format lat,lng,distance',
            400,
          ),
        );
      }

      const tours = await TourModel.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
      });
      res.status(200).json({
        status: 'success',
        results: tours.length,
        data: tours,
      });
    } catch (error) {
      next(error);
    }
  };

  getDistances = async (req, res, next) => {
    try {
      const { latlng, unit } = req.params;
      const [lat, lng] = latlng.split(',');

      const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

      if (!lat || !lng) {
        next(
          new AppError(
            'Please provide latitude, longitude, in the format lat,lng',
            400,
          ),
        );
      }

      const distances = await TourModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng * 1, lat * 1],
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier,
            spherical: true,
          },
        },
        {
          $project: {
            distance: 1,
            name: 1,
          },
        },
        {
          $sort: {
            distance: 1,
          },
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: distances,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default Tours;
