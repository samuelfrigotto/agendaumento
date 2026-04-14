const { validationResult } = require('express-validator');
const agendamentosService = require('./agendamentos.service');
const { processImage } = require('../../middlewares/upload');

const listar = async (req, res, next) => {
  try {
    const { dataInicio, dataFim, status, petId, clienteId } = req.query;
    const agendamentos = await agendamentosService.listar(req.banhistaId, {
      dataInicio,
      dataFim,
      status,
      petId,
      clienteId
    });
    res.json(agendamentos);
  } catch (error) {
    next(error);
  }
};

const listarHoje = async (req, res, next) => {
  try {
    const agendamentos = await agendamentosService.listarHoje(req.banhistaId);
    res.json(agendamentos);
  } catch (error) {
    next(error);
  }
};

const listarSemana = async (req, res, next) => {
  try {
    const { data } = req.query; // data base da semana
    const agendamentos = await agendamentosService.listarSemana(req.banhistaId, data);
    res.json(agendamentos);
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

    const agendamento = await agendamentosService.criar(req.banhistaId, req.body);
    res.status(201).json(agendamento);
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const agendamento = await agendamentosService.buscarPorId(req.banhistaId, req.params.id);
    res.json(agendamento);
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

    const agendamento = await agendamentosService.atualizar(req.banhistaId, req.params.id, req.body);
    res.json(agendamento);
  } catch (error) {
    next(error);
  }
};

const atualizarStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status e obrigatorio' });
    }

    const agendamento = await agendamentosService.atualizarStatus(req.banhistaId, req.params.id, status);
    res.json(agendamento);
  } catch (error) {
    next(error);
  }
};

const marcarPago = async (req, res, next) => {
  try {
    const { formaPagamento } = req.body;
    const agendamento = await agendamentosService.marcarPago(req.banhistaId, req.params.id, formaPagamento);
    res.json(agendamento);
  } catch (error) {
    next(error);
  }
};

const cancelar = async (req, res, next) => {
  try {
    await agendamentosService.cancelar(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const avisarPronto = async (req, res, next) => {
  try {
    const result = await agendamentosService.avisarPronto(req.banhistaId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const uploadFotoPronto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const fotoUrl = await processImage(req.file.buffer, req.banhistaId, 'pronto');
    const agendamento = await agendamentosService.atualizarFotoPronto(req.banhistaId, req.params.id, fotoUrl);

    res.json(agendamento);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  listarHoje,
  listarSemana,
  criar,
  buscarPorId,
  atualizar,
  atualizarStatus,
  marcarPago,
  cancelar,
  avisarPronto,
  uploadFotoPronto
};
