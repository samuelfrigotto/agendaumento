const { validationResult } = require('express-validator');
const clientesService = require('./clientes.service');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, busca } = req.query;
    const clientes = await clientesService.listar(req.banhistaId, {
      page: parseInt(page),
      limit: parseInt(limit),
      busca
    });
    res.json(clientes);
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

    const cliente = await clientesService.criar(req.banhistaId, req.body);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const cliente = await clientesService.buscarPorId(req.banhistaId, req.params.id);
    res.json(cliente);
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

    const cliente = await clientesService.atualizar(req.banhistaId, req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    await clientesService.remover(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  criar,
  buscarPorId,
  atualizar,
  remover
};
