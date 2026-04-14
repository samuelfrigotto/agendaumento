const publicService = require('./public.service');

const listarServicos = async (req, res, next) => {
  try {
    const servicos = await publicService.listarServicos();
    res.json({ servicos });
  } catch (error) {
    next(error);
  }
};

const obterServico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const servico = await publicService.obterServico(id);
    res.json(servico);
  } catch (error) {
    next(error);
  }
};

const obterDisponibilidade = async (req, res, next) => {
  try {
    const { data, servicoId } = req.query;

    if (!data) {
      return res.status(400).json({ error: 'Data e obrigatoria' });
    }

    if (!servicoId) {
      return res.status(400).json({ error: 'servicoId e obrigatorio' });
    }

    // Validar data (deve ser hoje ou futura)
    const dataQuery = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataQuery < hoje) {
      return res.status(400).json({ error: 'Data deve ser hoje ou uma data futura' });
    }

    const disponibilidade = await publicService.calcularDisponibilidade(data, servicoId);
    res.json(disponibilidade);
  } catch (error) {
    next(error);
  }
};

const obterInfoEstabelecimento = async (req, res, next) => {
  try {
    const info = await publicService.obterInfoEstabelecimento();
    res.json(info);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarServicos,
  obterServico,
  obterDisponibilidade,
  obterInfoEstabelecimento
};
