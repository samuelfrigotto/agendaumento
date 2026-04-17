const service = require('./pets.service');

async function listar(req, res, next) {
  try {
    const data = await service.listarDoCliente(req.cliente.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const pet = await service.criar({ clienteId: req.cliente.id, ...req.body });
    res.status(201).json(pet);
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const pet = await service.atualizar(+req.params.id, req.cliente.id, req.body);
    res.json(pet);
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    await service.remover(+req.params.id, req.cliente.id);
    res.json({ mensagem: 'Pet removido.' });
  } catch (err) { next(err); }
}

module.exports = { listar, criar, atualizar, remover };
