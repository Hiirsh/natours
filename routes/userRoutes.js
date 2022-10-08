const express = require('express')

const { getAllUsers, getUser, updateUser, deleteUser, updateCurrentUser, deleteCurrentUser, getCurrentUser, uploadUserPhoto, resizeUserPhoto } = require('./../controllers/userController')
const { signUp, login, forgotPassword, resetPassword, protect, updatePassword, restrictTo, logout } = require('./../controllers/authController')

const router = express.Router()

router.post('/signup', signUp)
router.post('/login', login)
router.get('/logout', logout)
router.post('/forgot_password', forgotPassword)
router.patch('/reset_password/:token', resetPassword)

router.use(protect)

router.patch('/update_password', updatePassword)
router.get('/me', getCurrentUser, getUser)
router.patch('/update_current_user', uploadUserPhoto, resizeUserPhoto, updateCurrentUser)
router.delete('/delete_current_user', deleteCurrentUser)

router.use(restrictTo('admin'))

router
  .route('/')
  .get(getAllUsers)

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)


module.exports = router