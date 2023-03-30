const mongoose = require('../config/database');

const TreinoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  exercicios: [{
    exercicio: {
      type: String,
      required: true
    },
    carga: Number,
    repeticao: String,
    descanso: String,
    observacao: String,
  }],
  observacao: String,
  instrutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'instrutor',
    required: true
  },
  aluno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'aluno',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ativo: {
    type: Boolean,
    default: true
  }
});

const Treino = mongoose.model('Treino', TreinoSchema);

module.exports = Treino;