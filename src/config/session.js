const mongoose = require('mongoose');

const startSession = async () => {
  return await mongoose.startSession();
};

module.exports = startSession;