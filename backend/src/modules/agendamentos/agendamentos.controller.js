const service = require('./agendamentos.service');

// Admin
async function listar(req, res, next) {
  try {
    const { semana, status, pagina, limite } = req.query;
    const data = await service.listar({ semana, status, pagina: +pagina || 1, limite: +limite || 50 });
    res.json(data);
  } catch (err) { next(err); }
}

async function agenda(req, res, next) {
  try {
    const { inicio, fim } = req.query;
    if (!inicio || !fim) return res.status(400).json({ erro: 'Parâmetros "inicio" e "fim" obrigatórios.' });
    const data = await service.agenda(inicio, fim);
    res.json(data);
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const data = await service.buscarPorId(+req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function criarAdmin(req, res, next) {
  try {
    const data = await service.criarPeloAdmin(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function atualizarStatus(req, res, next) {
  try {
    const { status, valor_cobrado } = req.body;
    const data = await service.atualizarStatus(+req.params.id, status, valor_cobrado);
    res.json(data);
  } catch (err) { next(err); }
}

// Cliente
async function criarCliente(req, res, next) {
  try {
    const { petId, servicoId, dataHora, observacoes } = req.body;
    const data = await service.criarPeloCliente({
      clienteId: req.cliente.id,
      petId, servicoId, dataHora, observacoes,
    });
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function cancelarCliente(req, res, next) {
  try {
    await service.cancelarPeloCliente(+req.params.id, req.cliente.id);
    res.json({ mensagem: 'Agendamento cancelado.' });
  } catch (err) { next(err); }
}

async function meus(req, res, next) {
  try {
    const data = await service.listarDoCliente(req.cliente.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function buscarPublico(req, res, next) {
  try {
    const { busca } = req.query;
    if (!busca) return res.status(400).json({ erro: 'Informe CPF ou telefone.' });
    const data = await service.buscarPorCpfOuTelefone(busca);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { listar, agenda, buscarPorId, criarAdmin, atualizarStatus, criarCliente, cancelarCliente, meus, buscarPublico };
