const { validationResult } = require('express-validator');
const clienteAreaService = require('./clienteArea.service');

// ========== AGENDAMENTOS ==========

const listarAgendamentos = async (req, res, next) => {
  try {
    const { futuros } = req.query;

    let agendamentos;
    if (futuros === 'true') {
      agendamentos = await clienteAreaService.listarAgendamentosFuturos(req.clienteId);
    } else {
      agendamentos = await clienteAreaService.listarAgendamentos(req.clienteId);
    }

    res.json({ agendamentos });
  } catch (error) {
    next(error);
  }
};

const criarAgendamento = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const agendamento = await clienteAreaService.criarAgendamento(
      req.clienteId,
      req.banhistaId,
      req.body
    );

    res.status(201).json(agendamento);
  } catch (error) {
    next(error);
  }
};

const cancelarAgendamento = async (req, res, next) => {
  try {
    const result = await clienteAreaService.cancelarAgendamento(
      req.clienteId,
      req.params.id
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ========== PETS ==========

const listarPets = async (req, res, next) => {
  try {
    const pets = await clienteAreaService.listarPets(req.clienteId);
    res.json({ pets });
  } catch (error) {
    next(error);
  }
};

const criarPet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pet = await clienteAreaService.criarPet(
      req.clienteId,
      req.banhistaId,
      req.body
    );

    res.status(201).json(pet);
  } catch (error) {
    next(error);
  }
};

// ========== PERFIL ==========

const obterPerfil = async (req, res, next) => {
  try {
    const perfil = await clienteAreaService.obterPerfil(req.clienteId);
    res.json(perfil);
  } catch (error) {
    next(error);
  }
};

const atualizarPerfil = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const perfil = await clienteAreaService.atualizarPerfil(req.clienteId, req.body);
    res.json(perfil);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarAgendamentos,
  criarAgendamento,
  cancelarAgendamento,
  listarPets,
  criarPet,
  obterPerfil,
  atualizarPerfil
};
