const mongoose = require('mongoose')
const Tour = require('./tourModels')

const reviewSchema = mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can not be empty.'],
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    // required: [true, 'Please ']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour']
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
  // this
  //   .populate({
  //     path: 'user',
  //     select: 'name photo'
  //   })
  //   .populate({
  //     path: 'tour',
  //     select: 'name'
  //   })
  this
    .populate({
      path: 'user',
      select: 'name photo'
    })
  next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ])
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    })
  }
}

reviewSchema.post('save', function () {
  // this points to curr. document
  this.constructor.calcAverageRatings(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne()
  next()
})

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() does not work here, query is 
  await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review