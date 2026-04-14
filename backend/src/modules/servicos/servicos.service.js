const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const listar = async (banhistaId) => {
  const result = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante, ativo
     FROM servicos
     WHERE banhista_id = $1
     ORDER BY nome ASC`,
    [banhistaId]
  );

  return result.rows.map(s => ({
    id: s.id,
    nome: s.nome,
    duracaoMin: s.duracao_min,
    precoPequeno: s.preco_pequeno,
    precoMedio: s.preco_medio,
    precoGrande: s.preco_grande,
    precoGigante: s.preco_gigante,
    ativo: s.ativo
  }));
};

const criar = async (banhistaId, dados) => {
  const result = await query(
    `INSERT INTO servicos (banhista_id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante, ativo`,
    [banhistaId, dados.nome, dados.duracaoMin, dados.precoPequeno, dados.precoMedio, dados.precoGrande, dados.precoGigante]
  );

  const s = result.rows[0];
  return {
    id: s.id,
    nome: s.nome,
    duracaoMin: s.duracao_min,
    precoPequeno: s.preco_pequeno,
    precoMedio: s.preco_medio,
    precoGrande: s.preco_grande,
    precoGigante: s.preco_gigante,
    ativo: s.ativo
  };
};

const atualizar = async (banhistaId, servicoId, dados) => {
  const result = await query(
    `UPDATE servicos
     SET nome = COALESCE($3, nome),
         duracao_min = COALESCE($4, duracao_min),
         preco_pequeno = $5,
         preco_medio = $6,
         preco_grande = $7,
         preco_gigante = $8,
         ativo = COALESCE($9, ativo)
     WHERE id = $1 AND banhista_id = $2
     RETURNING id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante, ativo`,
    [servicoId, banhistaId, dados.nome, dados.duracaoMin, dados.precoPequeno, dados.precoMedio, dados.precoGrande, dados.precoGigante, dados.ativo]
  );

  if (result.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const s = result.rows[0];
  return {
    id: s.id,
    nome: s.nome,
    duracaoMin: s.duracao_min,
    precoPequeno: s.preco_pequeno,
    precoMedio: s.preco_medio,
    precoGrande: s.preco_grande,
    precoGigante: s.preco_gigante,
    ativo: s.ativo
  };
};

const remover = async (banhistaId, servicoId) => {
  // Soft delete - apenas desativa
  const result = await query(
    'UPDATE servicos SET ativo = false WHERE id = $1 AND banhista_id = $2 RETURNING id',
    [servicoId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }
};

module.exports = {
  listar,
  criar,
  atualizar,
  remover
};
