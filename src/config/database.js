const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://mongodb:27017';

mongoose.connect(MONGO_URI, { dbName: 'academia-app' })
  .then(() => console.log('MongoDB connected.'))
  .catch(error => console.log('MongoDB connection error.', error));

module.exports = mongoose;