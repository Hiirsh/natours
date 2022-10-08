const User = require('./../models/userModel')
const sharp = require('sharp')
const catchAssync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')
const { deleteOne, updateOne, getOne, getAll } = require('./../controllers/handlerFactory')
const multer = require('multer')

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })
const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image!', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next()
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)
  next()
}

const filterObj = (obj, ...allowedFields) => {
  const res = {}
  Object.keys(obj).forEach(k => {
    if (allowedFields.includes(k)) {
      res[k] = obj[k]
    }
  })
  return res
}

exports.getCurrentUser = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.updateCurrentUser = catchAssync(async (req, res, next) => {

  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use updatePassword', 400))
  }
  const fillteredBody = filterObj(req.body, 'name', 'email')
  if (req.file) {
    fillteredBody.photo = req.file.filename
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, fillteredBody, { new: true, runValidators: true })
  res.status(200).json({
    staus: 'success',
    data: { updatedUser }
  })
})

exports.deleteCurrentUser = catchAssync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).json({
    staus: 'success',
    data: null
  })
})

exports.createtUser = catchAssync(async (req, res) => {
  res.status(500).json({
    staus: 'error',
    message: 'Please use /signup instead'
  })
})

exports.getAllUsers = getAll(User)
exports.getUser = getOne(User)
exports.updateUser = updateOne(User)
exports.deleteUser = deleteOne(User)