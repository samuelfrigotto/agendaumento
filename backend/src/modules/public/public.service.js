const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { calcularSlots } = require('../disponibilidade/disponibilidade.service');

// ID do banhista de demonstracao
const getDemoBanhistaId = async () => {
  if (process.env.DEMO_BANHISTA_ID) {
    return process.env.DEMO_BANHISTA_ID;
  }
  const result = await query('SELECT id FROM banhistas WHERE ativo = true LIMIT 1');
  if (result.rows.length === 0) {
    throw new AppError('Nenhum estabelecimento disponivel', 500);
  }
  return result.rows[0].id;
};

const listarServicos = async () => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante
     FROM servicos
     WHERE banhista_id = $1 AND ativo = true
     ORDER BY nome ASC`,
    [banhistaId]
  );

  return result.rows.map(row => ({
    id: row.id,
    nome: row.nome,
    duracaoMin: row.duracao_min,
    precoPequeno: parseFloat(row.preco_pequeno) || 0,
    precoMedio: parseFloat(row.preco_medio) || 0,
    precoGrande: parseFloat(row.preco_grande) || 0,
    precoGigante: parseFloat(row.preco_gigante) || 0
  }));
};

const obterServico = async (servicoId) => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante
     FROM servicos
     WHERE id = $1 AND banhista_id = $2 AND ativo = true`,
    [servicoId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    nome: row.nome,
    duracaoMin: row.duracao_min,
    precoPequeno: parseFloat(row.preco_pequeno) || 0,
    precoMedio: parseFloat(row.preco_medio) || 0,
    precoGrande: parseFloat(row.preco_grande) || 0,
    precoGigante: parseFloat(row.preco_gigante) || 0
  };
};

const calcularDisponibilidade = async (data, servicoId) => {
  const banhistaId = await getDemoBanhistaId();

  const servicoResult = await query(
    'SELECT duracao_min FROM servicos WHERE id = $1 AND banhista_id = $2 AND ativo = true',
    [servicoId, banhistaId]
  );

  if (servicoResult.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const duracaoMin = servicoResult.rows[0].duracao_min;
  const slots = await calcularSlots(banhistaId, data, duracaoMin);

  return { data, servicoId, duracaoMin, slots };
};

const obterInfoEstabelecimento = async () => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT nome_negocio, telefone
     FROM banhistas
     WHERE id = $1`,
    [banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Estabelecimento nao encontrado', 404);
  }

  return {
    nome: result.rows[0].nome_negocio || 'Agendaumento',
    telefone: result.rows[0].telefone
  };
};

module.exports = {
  listarServicos,
  obterServico,
  calcularDisponibilidade,
  obterInfoEstabelecimento
};
