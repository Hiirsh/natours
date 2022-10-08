const cryto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAssync = require('../utils/catchAsync')
const AppError = require('./../utils/AppError')
const Email = require('./../utils/email')

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true
  res.cookie('jwt', token, cookieOptions)

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  })
}

exports.signUp = catchAssync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  })
  const url = `${req.protocol}://${req.get('host')}/me`
  console.log(url)
  await new Email(user, url).sendWelcome()
  createSendToken(user, 201, res)
})

exports.login = catchAssync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.'), 401)
  }
  createSendToken(user, 200, res)
})

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAssync(async (req, res, next) => {
  //1) Get token
  // const token = (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  //   ? req.headers.authorization.split(' ')[1]
  //   : (req.cookie.jwt ?
  //     req.cookie.jwt :
  //     undefined)
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    return next(new AppError('Please log in to get access.', 401))
  }
  //2)verify T
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  //3)check is user exist
  const user = await User.findById(decoded.id)
  if (!user) {
    return next(new AppError('The user belonging to this tkoen no longer exist.'), 401)
  }
  //4)check if user changed password
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was changed.', 401))
  }
  req.user = user
  res.locals.user = user;
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You don\'t have permission', 403))
    }
    next()
  }
}

exports.forgotPassword = catchAssync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('No user with this email.', 404))
  }

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/reset_password/${resetToken}`
    await new Email(user, resetURL).sendPaswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.'
    })
  } catch (error) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError('Error while resetting. Try again later!', 500))
  }
})

exports.resetPassword = catchAssync(async (req, res, next) => {
  const hashedToken = cryto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  if (!user) {
    return next(new AppError('Link is invalid or has expired', 400))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()
  createSendToken(user, 200, res)
})

exports.updatePassword = catchAssync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Wrong password.', 401))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()
  createSendToken(user, 200, res)
})

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {

  if (req.cookies.jwt) {
    // console.log(req.cookies.jwt)
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};