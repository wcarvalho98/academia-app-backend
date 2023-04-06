const express = require('express');
const router = express.Router();
const { Instrutor, Aluno } = require('../models/User');
const Feedback = require('../models/Feedback');
const startSession = require('../config/session');
const Joi = require('joi');
const jwt = require('../config/midleware');

const feedbackSchema = Joi.object({
  avaliacao: Joi.number().min(1).max(5).required(),
  comentario: Joi.string().min(1).required(),
  aluno: Joi.string().hex().length(24).required(),
  instrutor: Joi.string().hex().length(24).required(),
});

router.post('/', jwt, async (req, res) => {
  const { error } = feedbackSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  if (!await Aluno.findById(req.auth.id)) {
    return res.status(403).send({ message: 'Ação não permitida' });
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const { aluno: alunoId, instrutor: instrutorId } = req.body;
    const authAluno = await Aluno.findById(req.auth.id);
    if (authAluno._id.toString() !== alunoId) {
      throw Error('Ação não permitida para este usuário');
    }
    const instrutor = await Instrutor.findById(instrutorId);
    if (!instrutor) {
      throw Error('Instrutor do feedback não encontrado');
    }
    if (!instrutor.alunos.includes(alunoId)) {
      throw Error('Instrutor não possui o aluno informado');
    }
    const feedback = new Feedback(req.body);
    await feedback.save();
    instrutor.feedbacks.push(feedback);
    await instrutor.save();
    await session.commitTransaction();
    res.status(201).send({ feedback });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).send({ message: 'Aconteceu algum erro ao deixar o feedback' });
  } finally {
    session.endSession();
  }
});

router.get('/:id', async (req, res) => {
  const instrutorId = req.params.id;

  try {
    const instrutor = await Instrutor.findById(instrutorId).populate('feedbacks');
    if (!instrutor) {
      return res.status(400).send({ message: 'Instrutor não encontrado' });
    }
    res.status(200).send({ feedbacks: instrutor.feedbacks });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Ocorreu algum erro ao obter os feedbacks' });
  }
});

const feedbackUpdateSchema = Joi.object({
  avaliacao: Joi.number().min(1).max(5).optional(),
  comentario: Joi.string().optional(),
});

router.patch('/:id', jwt, async (req, res) => {
  const { error } = feedbackUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const aluno = await Aluno.findById(req.auth.id);
    if (!aluno) {
      throw Error('Ação proibida para instrutores');
    }
    const feedbackAtual = await Feedback.findById(req.params.id);
    if (!feedbackAtual) {
      throw Error('Feedback não encontrado');
    }
    if (feedbackAtual.aluno._id.toString() !== aluno._id.toString()) {
      throw Error('Ação proibida para este usuário');
    }
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    await session.commitTransaction();
    res.status(200).send({ feedback });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).send({ message: 'Ocorreu algum erro ao atualizar o feedback' });
  } finally {
    session.endSession();
  }
});

router.delete('/:id', jwt, async (req, res) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const aluno = await Aluno.findById(req.auth.id);
    if (!aluno) {
      throw Error('Ação proibida para instrutores');
    }
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      throw Error('Feedback não encontrado');
    }
    if (feedback.aluno._id.toString() !== aluno._id.toString()) {
      throw Error('Ação proibida para este usuário');
    }

    const { error } = await Instrutor.findByIdAndUpdate(feedback.instrutor, { $pull: { 'feedbacks': req.params.id } });
    if (error) {
      throw error;
    }
    await Feedback.findByIdAndDelete(req.params.id);

    await session.commitTransaction();
    res.status(200).send({ feedback });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).send({ message: 'Ocorreu algum erro ao deletar o feedback' });
  } finally {
    session.endSession();
  }
});

module.exports = router;