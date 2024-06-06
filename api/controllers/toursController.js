import sharp from 'sharp';
import TourModel from '../models/tourModel.js';
import AppError from '../utils/error.js';
import Uploader from '../utils/imageUploader.js';
import BaseController from './baseController.js';
import { bucket } from '../utils/firebase-config.js';

const uploader = new Uploader();

class Tours extends BaseController {
  constructor() {
    super(TourModel);
  }

  getTours = this.getAll;

  clearTourReq = (req, res, next) => {
    // remove the ratingsQuantity and the ratingsAverage from the request as it's calculated automatically
    // remove also the images if the user pass text to the req without passing actual images
    // and this removing happen before processing the images
    delete req.body.ratingsQuantity;
    delete req.body.ratingsAverage;
    delete req.body.images;
    delete req.body.imageCover;
    delete req.body.participants;
    delete req.body.soldOut;

    next();
  };

  // this middleware will check if the tour exist in case of creating and get the tour name in case of updating
  // so we can use it on the image name
  checkTour = async (req, res, next) => {
    try {
      // If it's a POST request (creating a new tour), return an error as the tour already exists
      if (req.method === 'POST') {
        const tour = await TourModel.findOne({ name: req.body.name });
        if (tour)
          return next(
            new AppError('A tour with this name already exists.', 400),
          );
      }

      if (['PUT', 'PATCH'].includes(req.method)) {
        // Retrieve the tour based on the provided tour ID.
        const tour = await TourModel.findById(req.params.id);

        if (!tour) {
          // If tour does not exist, return an error
          return next(new AppError('Tour not found.', 404));
        }

        // If it's a PUT request (updating a tour), pass the tour name to the next middleware
        req.body.name = tour.name;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

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

  uploadTourImages = uploader.upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 8 },
  ]);

  resizeTourImages = async (req, res, next) => {
    if (!req.files || (!req.files.imageCover && !req.files.images))
      return next();
    try {
      const tourName = req.body.name.replace(/\s+/g, '-').toLowerCase();
      if (req.files.imageCover) {
        // Generate filenames based on tour name
        req.files.imageCover[0].filename = `tour-${tourName}-cover.jpeg`;
        const resizedBuffer = await sharp(req.files.imageCover[0].buffer)
          .resize(2000, 1333, {
            fit: 'cover',
            position: 'center',
          })
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toBuffer();
        req.files.imageCover[0].buffer = resizedBuffer;
      }

      if (req.files.images) {
        await Promise.all(
          req.files.images.map(async (file, i) => {
            const filename = `tour-${tourName}-${i + 1}.jpeg`;
            const resizedBuffer = await sharp(file.buffer)
              .resize(2000, 1333, {
                fit: 'cover',
                position: 'center',
              })
              .toFormat('jpeg')
              .jpeg({ quality: 90 })
              .toBuffer();
            // file.buffer = resizedBuffer;
            req.files.images[i] = {
              buffer: resizedBuffer,
              filename: filename,
            };
          }),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Firebase Upload
  handleTourImagesUpload = async (req, res, next) => {
    if (!req.files || (!req.files.imageCover && !req.files.images))
      return next();
    try {
      if (req.files.imageCover) {
        const coverBlob = bucket.file(
          `uploads/tours/covers/${req.files.imageCover[0].filename}`,
        );
        const coverBlobStream = coverBlob.createWriteStream({
          metadata: { contentType: 'image/jpeg' },
        });

        await new Promise((resolve, reject) => {
          coverBlobStream.on('error', reject);
          coverBlobStream.on('finish', () => {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${coverBlob.name.split('/').join('%2F')}?alt=media`;
            req.body.imageCover = publicUrl;
            resolve();
          });
          coverBlobStream.end(req.files.imageCover[0].buffer);
        });
      }

      if (req.files.images) {
        req.body.images = [];
        await Promise.all(
          req.files.images.map(async (image) => {
            const imageBlob = bucket.file(
              `uploads/tours/images/${image.filename}`,
            );
            const imageBlobStream = imageBlob.createWriteStream({
              metadata: { contentType: 'image/jpeg' },
            });

            await new Promise((resolve, reject) => {
              imageBlobStream.on('error', reject);
              imageBlobStream.on('finish', () => {
                const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${imageBlob.name.split('/').join('%2F')}?alt=media`;
                req.body.images.push(publicUrl);
                resolve();
              });
              imageBlobStream.end(image.buffer);
            });
          }),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  parseFormData = (req, res, next) => {
    if (req.body.startDates) {
      req.body.startDates = JSON.parse(req.body.startDates);
    }
    if (req.body.startLocation) {
      req.body.startLocation = JSON.parse(req.body.startLocation);
    }
    if (req.body.locations) {
      req.body.locations = JSON.parse(req.body.locations);
    }
    if (req.body.guides) {
      req.body.guides = JSON.parse(req.body.guides);
    }
    next();
  };
}

export default Tours;
