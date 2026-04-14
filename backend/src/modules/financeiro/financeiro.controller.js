const financeiroService = require('./financeiro.service');

const getResumo = async (req, res, next) => {
  try {
    const resumo = await financeiroService.getResumo(req.banhistaId);
    res.json(resumo);
  } catch (error) {
    next(error);
  }
};

const getHistorico = async (req, res, next) => {
  try {
    const { meses = 6 } = req.query;
    const historico = await financeiroService.getHistorico(req.banhistaId, parseInt(meses));
    res.json(historico);
  } catch (error) {
    next(error);
  }
};

const getPendentes = async (req, res, next) => {
  try {
    const pendentes = await financeiroService.getPendentes(req.banhistaId);
    res.json(pendentes);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumo,
  getHistorico,
  getPendentes
};
