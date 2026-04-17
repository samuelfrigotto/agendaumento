const service = require('./disponibilidade.service');

const listarRegras    = (req, res, next) => service.listarRegras().then(d => res.json(d)).catch(next);
const salvarRegras    = (req, res, next) => service.salvarRegras(req.body.regras).then(() => res.json({ mensagem: 'Disponibilidade salva.' })).catch(next);
const listarBloqueados= (req, res, next) => service.listarBloqueados().then(d => res.json(d)).catch(next);
const adicionarBloqueio=(req, res, next)=> service.adicionarBloqueio(req.body).then(d => res.status(201).json(d)).catch(next);
const removerBloqueio = (req, res, next) => service.removerBloqueio(+req.params.id).then(() => res.json({ mensagem: 'Bloqueio removido.' })).catch(next);

async function slotsDisponiveis(req, res, next) {
  try {
    const { data, duracao } = req.query;
    if (!data) return res.status(400).json({ erro: 'Parâmetro "data" obrigatório (YYYY-MM-DD).' });
    const slots = await service.slotsDisponiveis(data, parseInt(duracao) || 60);
    res.json({ data, slots });
  } catch (err) { next(err); }
}

module.exports = { listarRegras, salvarRegras, listarBloqueados, adicionarBloqueio, removerBloqueio, slotsDisponiveis };
