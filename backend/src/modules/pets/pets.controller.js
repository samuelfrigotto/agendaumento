const { validationResult } = require('express-validator');
const petsService = require('./pets.service');
const { processImage } = require('../../middlewares/upload');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, busca, clienteId } = req.query;
    const pets = await petsService.listar(req.banhistaId, {
      page: parseInt(page),
      limit: parseInt(limit),
      busca,
      clienteId
    });
    res.json(pets);
  } catch (error) {
    next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pet = await petsService.criar(req.banhistaId, req.body);
    res.status(201).json(pet);
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const pet = await petsService.buscarPorId(req.banhistaId, req.params.id);
    res.json(pet);
  } catch (error) {
    next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pet = await petsService.atualizar(req.banhistaId, req.params.id, req.body);
    res.json(pet);
  } catch (error) {
    next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    await petsService.remover(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const uploadFoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const fotoUrl = await processImage(req.file.buffer, req.banhistaId, 'pet');
    const pet = await petsService.atualizarFoto(req.banhistaId, req.params.id, fotoUrl);

    res.json(pet);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  criar,
  buscarPorId,
  atualizar,
  remover,
  uploadFoto
};
