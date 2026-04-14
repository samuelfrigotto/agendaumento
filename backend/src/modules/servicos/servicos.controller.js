const { validationResult } = require('express-validator');
const servicosService = require('./servicos.service');

const listar = async (req, res, next) => {
  try {
    const servicos = await servicosService.listar(req.banhistaId);
    res.json(servicos);
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

    const servico = await servicosService.criar(req.banhistaId, req.body);
    res.status(201).json(servico);
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

    const servico = await servicosService.atualizar(req.banhistaId, req.params.id, req.body);
    res.json(servico);
  } catch (error) {
    next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    await servicosService.remover(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  criar,
  atualizar,
  remover
};
