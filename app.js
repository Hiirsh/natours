const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const app = express();
const path = require('path')
const viewRouter = require('./routes/viewRoutes')
const cookieParser = require('cookie-parser')

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Serving static files
app.use(express.static(path.join(__dirname, 'public')))

const hpp = require('hpp')
// 1. MIDDLEWARES
// Security http headers
app.use(helmet())

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}



// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later'
})
app.use('/api', limiter)


// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())
// Data sanitization against no NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against noXSS
app.use(xss())

// Prevent parametr pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}))

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});


// 2. ROUTES
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can\'t find ${req.originalUrl} on the server!`, 404))
})

app.use(globalErrorHandler)

// 3. SERVER START
module.exports = app;
