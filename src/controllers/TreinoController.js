const express = require('express');
const router = express.Router();
const { Instrutor, Aluno } = require('../models/User');
const Treino = require('../models/Treino');
const startSession = require('../config/session');
const Joi = require('joi');
const jwt = require('../config/midleware');

const exercicioSchema = Joi.object({
  exercicio: Joi.string().required(),
  carga: Joi.number().optional(),
  repeticao: Joi.string().optional(),
  descanso: Joi.string().optional(),
  observacao: Joi.string().optional(),
});

const treinoSchema = Joi.object({
  nome: Joi.string().required(),
  descricao: Joi.string().optional(),
  exercicios: Joi.array().items(exercicioSchema).optional(),
  instrutor: Joi.string().email().required(),
  aluno: Joi.string().email().required(),
  observacao: Joi.string().optional(),
});

const treinoAtualizaSchema = Joi.object({
  nome: Joi.string().optional(),
  descricao: Joi.string().optional(),
  exercicios: Joi.array().items(exercicioSchema).optional(),
  instrutor: Joi.string().email().optional(),
  aluno: Joi.string().email().optional(),
  observacao: Joi.string().optional(),
  ativo: Joi.boolean().optional(),
});

router.post('/', jwt, async (req, res) => {
  const { error } = treinoSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  if (!await Instrutor.findById(req.auth.id)) {
    return res.status(403).send({ message: 'Ação não autorizada' });
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const { aluno: emailAluno, instrutor: emailInstrutor } = req.body;
    const aluno = await Aluno.findOne({ email: emailAluno });
    if (!aluno) {
      return res.status(401).send({ message: 'Aluno não encontrado no sistema' });
    }
    const instrutor = await Instrutor.findOne({ email: emailInstrutor });
    if (!instrutor) {
      return res.status(401).send({ message: 'Instrutor não encontrado no sistema' });
    }
    if (!instrutor.alunos.includes(aluno._id)) {
      instrutor.alunos.push(aluno);
      await instrutor.save();
    }
    const treino = new Treino({ ...req.body, aluno: aluno._id, instrutor: instrutor._id });
    await treino.save();
    aluno.treinos.atuais.push(treino);
    aluno.instrutor = instrutor;
    await aluno.save();

    await session.commitTransaction();
    res.status(201).send({ treino });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).send({ message: 'Aconteceu algum erro durante a criação do treino' });
  } finally {
    session.endSession();
  }
});

router.patch('/:id', jwt, async (req, res) => {
  const { error } = treinoAtualizaSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const session = await startSession();
  session.startTransaction();

  try {
    const treinoId = req.params.id;
    const ativarTreino = req.body.ativo;
    let treino = await Treino.findByIdAndUpdate(treinoId, { ...req.body });
    if (ativarTreino !== undefined && ativarTreino !== treino.ativo) {
      const aluno = await Aluno.findById(treino.aluno);
      if (!aluno) {
        throw Error('Aluno não foi encontrado');
      }
      const treinoIndex = aluno.treinos[treino.ativo ? 'atuais' : 'anteriores'].indexOf(treinoId);
      if (treinoIndex === -1) {
        throw Error('Treino do aluno não foi encontrado');
      }
      aluno.treinos[treino.ativo ? 'atuais' : 'anteriores'].splice(treinoIndex, 1);
      aluno.treinos[ativarTreino ? 'atuais' : 'anteriores'].push(treinoId);
      await aluno.save();
    }
    treino = await Treino.findById(treinoId);
    await session.commitTransaction();
    res.status(200).send({ treino });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    res.status(400).send({ message: 'Aconteceu algum erro ao atualizar o treino' });
  } finally {
    session.endSession();
  }
});

router.delete('/:id/delete', jwt, async (req, res) => {
  const treinoId = req.params.id;
  const session = await startSession();
  session.startTransaction();

  try {
    if (!(await Instrutor.findById(req.auth.id))) {
      return res.status(403).send({ message: 'Ação não permitida' });
    }
    const treino = await Treino.findByIdAndDelete(treinoId);
    if (!treino) {
      res.status(400).send({ message: 'Erro ao encontrar o treino' });
      throw Error('Erro ao encontrar o treino');
    }
    const { err } = await Aluno.findByIdAndUpdate(treino.aluno, { $pull: { 'treinos.atuais': treinoId, 'treinos.anteriores': treinoId } });
    if (err) {
      throw err;
    }
    await session.commitTransaction();
    res.status(200).send({ message: 'Treino deletado com sucesso' });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).send({ message: 'Aconteceu algum erro ao deletar o treino' });
  } finally {
    session.endSession();
  }
});

router.get('/aluno/:id', jwt, async (req, res) => {
  const alunoId = req.params.id;

  try {
    const instrutor = await Instrutor.findById(req.auth.id);
    if (!instrutor && req.auth.id !== alunoId) {
      return res.status(403).send({ message: 'Ação não permitida' });
    }
    const aluno = await Aluno.findById(alunoId)
      .populate('treinos.atuais')
      .populate('treinos.anteriores');
    if (!aluno) {
      return res.status(401).send({ message: 'Aluno não encontrado no sistema' });
    }

    res.status(200).send({ treinos: aluno.treinos });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Aconteceu algum erro ao resgatar o treino do aluno' });
  }
});

module.exports = router;