const mongoose = require('../config/database');

const FeedbackSchema = new mongoose.Schema({
  avaliacao: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    required: true
  },
  comentario: {
    type: String,
    required: true
  },
  aluno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aluno',
    required: true
  }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema)

module.exports = Feedback;