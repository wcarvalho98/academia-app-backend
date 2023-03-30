const mongoose = require('../config/database');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  senha: {
    type: String,
    required: true,
  },
  telefone: {
    type: String,
    required: false,
  },
  tipo: {
    type: String,
    enum: ['aluno', 'instrutor'],
    required: true,
  }
},
  { discriminatorKey: 'tipo' }
);

// Hash da senha antes de salvar no banco de dados
UserSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('senha')) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.senha, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      user.senha = hash;
      next();
    });
  });
});

// Verificar se a senha é válida
UserSchema.methods.verificarSenha = function (senha, callback) {
  bcrypt.compare(senha, this.senha, (err, isMatch) => {
    if (err) {
      return callback(err);
    }

    callback(null, isMatch);
  });
};

const AlunoSchema = new mongoose.Schema({
  instrutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'instrutor'
  },
  treinos: {
    atuais: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treino'
    }],
    anteriores: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treino'
    }]
  }
});

const InstrutorSchema = new mongoose.Schema({
  alunos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'aluno'
  }],
  descricao: String,
  imagem: String,
  qualificacoes: [String],
  atuacoes: [String],
  feedbacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }]
});

const User = mongoose.model('User', UserSchema);
const Aluno = User.discriminator('aluno', AlunoSchema);
const Instrutor = User.discriminator('instrutor', InstrutorSchema);

module.exports = { User, Aluno, Instrutor };