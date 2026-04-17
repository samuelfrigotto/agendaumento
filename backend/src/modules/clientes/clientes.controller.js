const service = require('./clientes.service');

async function listar(req, res, next) {
  try {
    const { pagina, limite, busca } = req.query;
    const data = await service.listar({
      pagina: parseInt(pagina) || 1,
      limite: Math.min(parseInt(limite) || 20, 100),
      busca: busca || '',
    });
    res.json(data);
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const data = await service.buscarPorId(parseInt(req.params.id));
    res.json(data);
  } catch (err) { next(err); }
}

async function pets(req, res, next) {
  try {
    const data = await service.pets(parseInt(req.params.id));
    res.json(data);
  } catch (err) { next(err); }
}

async function desativar(req, res, next) {
  try {
    await service.desativar(parseInt(req.params.id));
    res.json({ mensagem: 'Cliente desativado.' });
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, pets, desativar };
