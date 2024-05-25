import mongoose from 'mongoose';

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

const populatePlugin = (schema) => {
  const applyPopulate = function (next) {
    this.populate({
      path: 'user',
      select: 'name',
    }).populate({
      path: 'tour',
      select: 'name duration',
    });
    next();
  };

  schema.pre('find', applyPopulate);
  schema.pre('findOne', applyPopulate);
  schema.pre('findOneAndUpdate', applyPopulate);
};

reviewsSchema.plugin(populatePlugin);

const Review = mongoose.model('Review', reviewsSchema);

export default Review;
