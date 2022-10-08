const mongoose = require('mongoose')
// const dotenv = require('dotenv')
// dotenv.config({ path: './config.env' })
const app = require('./app')

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION')
  console.log(err)
})

console.log(process.env.NODE_ENV)
const DB = process.env.DATABASE
// .replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
// mongoose.connect(process.env.DATABASE_LOCAL, {
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connected seccesfull!'))

const port = process.env.PORT || 8000

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`)
})

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION')
  console.log(err)
  server.close(() => {
    process.exit(1)
  })
})


