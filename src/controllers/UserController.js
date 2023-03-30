const express = require('express');
const router = express.Router();
const { User, Instrutor } = require('../models/User');
const startSession = require('../config/session');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const jwtCallback = require('../config/midleware');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(8).required(),
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(8).required(),
  nome: Joi.string().required(),
  telefone: Joi.string().optional(),
  tipo: Joi.string().required().valid('aluno', 'instrutor'),
});

router.post('/', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    console.error('Erro ao criar usuário', err);
    res.status(500).send('Erro ao criar usuário');
  }
});

router.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ message: 'User is not valid' });
    }

    user.verificarSenha(senha, (err, isMatch) => {
      if (err) {
        return res.status(500).send({ message: 'Some error happened while peforming login' });
      }
      if (!isMatch) {
        return res.status(401).send({ message: 'Password is not valid' });
      }

      const token = jwt.sign({ id: user._id }, 'chave-secreta', { expiresIn: 86400 });

      res.json({ user, token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Some error happened while peforming login' });
  }
});

router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const instrutores = await Instrutor.find({
      $or: [
        { nome: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    });
    res.status(200).json({ instrutores });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Aconteceu algum erro ao obter instrutores' });
  }
});

const updateInstrutorSchema = Joi.object({
  descricao: Joi.string().optional(),
  imagem: Joi.string().optional(),
  qualificacoes: Joi.array().items(Joi.string()).optional(),
  atuacoes: Joi.array().items(Joi.string()).optional(),
});

router.patch('/instrutor', jwtCallback, async (req, res) => {
  const { error } = updateInstrutorSchema.validate(req.body);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }
  if (!await Instrutor.findById(req.auth.id)) {
    return res.status(403).send({ message: 'Ação proibida' });
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const instrutor = await Instrutor.findByIdAndUpdate(req.auth.id, { ...req.body }, { new: true });
    await session.commitTransaction();
    res.status(200).send({ instrutor });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).send({ message: 'Algum erro ocorreu ao atualizar o instrutor' });
  } finally {
    session.endSession();
  }
});

module.exports = router;