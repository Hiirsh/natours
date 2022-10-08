const express = require('express')
const { protect, restrictTo } = require('../controllers/authController')
const { getReviews, createReview, deleteReview, updateReview, setTourUserId, getReview } = require('../controllers/reviewController')

const router = express.Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .get(getReviews)
  .post(
    restrictTo('user'),
    setTourUserId,
    createReview)

router.route('/:id')
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .get(getReview)

module.exports = router