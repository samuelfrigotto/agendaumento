const whatsappService = require('./whatsapp.service');

const getStatus = async (req, res, next) => {
  try {
    const status = await whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
};

const enviarCustom = async (req, res, next) => {
  try {
    const { telefone, mensagem } = req.body;

    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem sao obrigatorios' });
    }

    const result = await whatsappService.enviarCustom(req.banhistaId, telefone, mensagem);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  enviarCustom
};
