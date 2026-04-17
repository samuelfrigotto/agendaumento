const service = require('./tiposAnimais.service');

const listar   = (req, res, next) => service.listar().then(d => res.json(d)).catch(next);
const criar    = (req, res, next) => service.criar(req.body.nome).then(d => res.status(201).json(d)).catch(next);
const atualizar= (req, res, next) => service.atualizar(+req.params.id, req.body).then(d => res.json(d)).catch(next);
const remover  = (req, res, next) => service.remover(+req.params.id).then(() => res.json({ mensagem: 'Desativado.' })).catch(next);

module.exports = { listar, criar, atualizar, remover };
