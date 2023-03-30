const mongoose = require('mongoose');

const uri = "mongodb+srv://wcarvalho98:mongodbPassword@clustertest.h0t5lsh.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri, { dbName: 'academia-app' })
  .then(() => console.log('MongoDB connected.'))
  .catch(error => console.log('MongoDB connection error.', error));

module.exports = mongoose;