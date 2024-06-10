import mongoose from 'mongoose';
import TourModel from './tourModel.js';

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must have a user'],
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must have a tour'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    tourDate: {
      type: Date,
      required: [true, 'Booking must have a tour date'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email',
  }).populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

bookingSchema.statics.calcTourDateParticipants = async function (tourId) {
  try {
    const stats = await this.aggregate([
      { $match: { tour: tourId } },
      { $group: { _id: '$tourDate', participants: { $sum: 1 } } },
    ]);

    const tour = await TourModel.findById(tourId);
    if (!tour) throw new Error('Tour not found');

    if (stats.length > 0) {
      const statsMap = new Map(
        stats.map((s) => [s._id.toString(), s.participants]),
      );
      tour.startDates.forEach((date, i) => {
        const participants = statsMap.get(date.toString()) || 0;
        tour.participants[i] = participants;
        tour.soldOut[i] = participants >= tour.maxGroupSize;
      });
    } else {
      tour.participants = Array(tour.startDates.length).fill(0);
      tour.soldOut = Array(tour.startDates.length).fill(false);
    }
    await tour.save();
  } catch (err) {
    throw new Error(err);
  }
};

bookingSchema.post('save', function () {
  this.constructor.calcTourDateParticipants(this.tour);
});

bookingSchema.pre(/^findOneAnd/, async function (next) {
  // pass the date from pre to post middleware
  // reference the model to fetch the document before the update operation.
  this.r = await this.model.findOne(this.getQuery()).select([]);
  next();
});

bookingSchema.post(/^findOneAnd/, async function () {
  // Use the document retrieved in pre middleware to update the average ratings

  if (this.r) {
    await this.r.constructor.calcTourDateParticipants(this.r.tour._id);
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
