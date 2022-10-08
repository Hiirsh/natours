const { deleteOne, updateOne, createOne, getOne, getAll } = require("./../controllers/handlerFactory");
const Review = require('./../models/reviewModel')

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id
  next()
}

exports.getReviews = getAll(Review)
exports.createReview = createOne(Review)
exports.deleteReview = deleteOne(Review)
exports.updateReview = updateOne(Review)
exports.getReview = getOne(Review)