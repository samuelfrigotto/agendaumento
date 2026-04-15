const disponibilidadeService = require('./disponibilidade.service');

// ─── Regras semanais (admin) ──────────────────────────────────────────────────

const listarRegras = async (req, res, next) => {
  try {
    const regras = await disponibilidadeService.listarRegras(req.banhistaId);
    res.json({ regras });
  } catch (error) {
    next(error);
  }
};

const atualizarRegras = async (req, res, next) => {
  try {
    const { regras } = req.body;
    const resultado = await disponibilidadeService.atualizarRegras(req.banhistaId, regras);
    res.json({ regras: resultado });
  } catch (error) {
    next(error);
  }
};

// ─── Bloqueios (admin) ────────────────────────────────────────────────────────

const listarBloqueios = async (req, res, next) => {
  try {
    const apenasAtivos = req.query.ativos === 'true';
    const bloqueios = await disponibilidadeService.listarBloqueios(req.banhistaId, apenasAtivos);
    res.json({ bloqueios });
  } catch (error) {
    next(error);
  }
};

const criarBloqueio = async (req, res, next) => {
  try {
    const { startsAt, endsAt, reason } = req.body;
    const bloqueio = await disponibilidadeService.criarBloqueio(req.banhistaId, { startsAt, endsAt, reason });
    res.status(201).json(bloqueio);
  } catch (error) {
    next(error);
  }
};

const removerBloqueio = async (req, res, next) => {
  try {
    await disponibilidadeService.removerBloqueio(req.banhistaId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarRegras,
  atualizarRegras,
  listarBloqueios,
  criarBloqueio,
  removerBloqueio
};
