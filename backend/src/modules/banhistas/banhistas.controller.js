const banhistasService = require('./banhistas.service');

const getPerfil = async (req, res, next) => {
  try {
    const perfil = await banhistasService.getPerfil(req.banhistaId);
    res.json(perfil);
  } catch (error) {
    next(error);
  }
};

const atualizarPerfil = async (req, res, next) => {
  try {
    const { nome, telefone, nomeNegocio } = req.body;
    const perfil = await banhistasService.atualizarPerfil(req.banhistaId, {
      nome,
      telefone,
      nomeNegocio
    });
    res.json(perfil);
  } catch (error) {
    next(error);
  }
};

const alterarSenha = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias' });
    }

    await banhistasService.alterarSenha(req.banhistaId, senhaAtual, novaSenha);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await banhistasService.getDashboard(req.banhistaId);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPerfil,
  atualizarPerfil,
  alterarSenha,
  getDashboard
};
