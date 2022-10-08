const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('./../../models/tourModels')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')
dotenv.config({ path: './dev.env' })

const DB = process.env.DATABASE
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => console.log('DB connection seccessful!'))

const tours = JSON.parse(fs.readFileSync(__dirname + '/tours.json', 'utf-8'))
const users = JSON.parse(fs.readFileSync(__dirname + '/users.json', 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(__dirname + '/reviews.json', 'utf-8'))

const importData = async () => {
  try {
    await Tour.create(tours)
    await User.create(users, {validateBeforeSave:false})
    await Review.create(reviews)
    console.log('Imported')
  } catch (error) {
    console.error(error)
  }
  process.exit()
}

const deteteData = async () => {
  try {
    await Tour.deleteMany()
    await User.deleteMany()
    await Review.deleteMany()
    console.log('Deleted')
  } catch (error) {
    console.error(error)
  }
  process.exit()
}
if(process.argv[2]==="--delete"){
  deteteData()
}

if(process.argv[2]==="--import"){
  importData()
}


console.log(process.argv)