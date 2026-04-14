const { validationResult } = require('express-validator');
const tiposAnimaisService = require('./tiposAnimais.service');

const listar = async (req, res, next) => {
  try {
    const { especie } = req.query;
    const tipos = await tiposAnimaisService.listar(req.banhistaId, especie);
    res.json({ tipos });
  } catch (error) {
    next(error);
  }
};

const listarEspecies = async (req, res, next) => {
  try {
    const especies = await tiposAnimaisService.listarEspecies(req.banhistaId);
    res.json({ especies });
  } catch (error) {
    next(error);
  }
};

const listarRacas = async (req, res, next) => {
  try {
    const { especie } = req.params;
    const racas = await tiposAnimaisService.listarRacasPorEspecie(req.banhistaId, especie);
    res.json({ racas });
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

    const tipo = await tiposAnimaisService.criar(req.banhistaId, req.body);
    res.status(201).json(tipo);
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

    const tipo = await tiposAnimaisService.atualizar(req.banhistaId, req.params.id, req.body);
    res.json(tipo);
  } catch (error) {
    next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    await tiposAnimaisService.remover(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  listarEspecies,
  listarRacas,
  criar,
  atualizar,
  remover
};
