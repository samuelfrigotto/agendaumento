const service = require('./configuracoes.service');

const listar = (req, res, next) => service.listar().then(d => res.json(d)).catch(next);

async function salvar(req, res, next) {
  try {
    // Aceita objeto { chave: valor } ou array [{ chave, valor }]
    const body = req.body;
    const pares = Array.isArray(body)
      ? body
      : Object.entries(body).map(([chave, valor]) => ({ chave, valor }));
    await service.salvar(pares);
    res.json({ mensagem: 'Configurações salvas.' });
  } catch (err) { next(err); }
}

module.exports = { listar, salvar };
