import mongoose from 'mongoose';
import TourModel from './tourModel.js';

const reviewsSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Comment can't be empty"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewsSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewsSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewsSchema.pre(/.*(u|U)pdate.*$|save/, function (next) {
  // remove the user and the tour id from any update query
  if (this.isNew) return next();
  // Get the update object
  const update = this.getUpdate();

  // Remove user and tour from the update object
  if (update.$set) {
    delete update.$set.user;
    delete update.$set.tour;
  } else {
    delete update.user;
    delete update.tour;
  }

  next();
});

reviewsSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // Default value if no ratings
    });
  }
};

reviewsSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewsSchema.pre(/^findOneAnd/, async function (next) {
  // pass the date from pre to post middleware
  // reference the model to fetch the document before the update operation.
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewsSchema.post(/^findOneAnd/, async function () {
  // Use the document retrieved in pre middleware to update the average ratings
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewsSchema);

export default Review;
