const service = require('./servicos.service');

const listar   = (req, res, next) => service.listar({ apenasAtivos: req.admin ? false : true }).then(d => res.json(d)).catch(next);
const criar    = (req, res, next) => service.criar(req.body).then(d => res.status(201).json(d)).catch(next);
const atualizar= (req, res, next) => service.atualizar(+req.params.id, req.body).then(d => res.json(d)).catch(next);
const remover  = (req, res, next) => service.remover(+req.params.id).then(() => res.json({ mensagem: 'Serviço desativado.' })).catch(next);

module.exports = { listar, criar, atualizar, remover };
