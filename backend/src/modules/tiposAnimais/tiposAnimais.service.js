const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const listar = async (banhistaId, especie = null) => {
  let sql = `
    SELECT id, especie, raca, ativo
    FROM tipos_animais
    WHERE banhista_id = $1 AND ativo = true
  `;
  const params = [banhistaId];

  if (especie) {
    sql += ' AND especie = $2';
    params.push(especie);
  }

  sql += ' ORDER BY especie ASC, raca ASC';

  const result = await query(sql, params);
  return result.rows;
};

const listarEspecies = async (banhistaId) => {
  const result = await query(
    `SELECT DISTINCT especie
     FROM tipos_animais
     WHERE banhista_id = $1 AND ativo = true
     ORDER BY especie ASC`,
    [banhistaId]
  );
  return result.rows.map(r => r.especie);
};

const listarRacasPorEspecie = async (banhistaId, especie) => {
  const result = await query(
    `SELECT id, raca
     FROM tipos_animais
     WHERE banhista_id = $1 AND especie = $2 AND ativo = true AND raca IS NOT NULL
     ORDER BY raca ASC`,
    [banhistaId, especie]
  );
  return result.rows;
};

const criar = async (banhistaId, dados) => {
  // Verificar se ja existe
  const existe = await query(
    `SELECT id FROM tipos_animais
     WHERE banhista_id = $1 AND especie = $2 AND (raca = $3 OR (raca IS NULL AND $3 IS NULL))`,
    [banhistaId, dados.especie, dados.raca || null]
  );

  if (existe.rows.length > 0) {
    throw new AppError('Este tipo de animal ja existe', 400);
  }

  const result = await query(
    `INSERT INTO tipos_animais (banhista_id, especie, raca)
     VALUES ($1, $2, $3)
     RETURNING id, especie, raca, ativo`,
    [banhistaId, dados.especie, dados.raca || null]
  );

  return result.rows[0];
};

const atualizar = async (banhistaId, tipoId, dados) => {
  const result = await query(
    `UPDATE tipos_animais
     SET especie = COALESCE($3, especie),
         raca = $4,
         ativo = COALESCE($5, ativo)
     WHERE id = $1 AND banhista_id = $2
     RETURNING id, especie, raca, ativo`,
    [tipoId, banhistaId, dados.especie, dados.raca, dados.ativo]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tipo de animal nao encontrado', 404);
  }

  return result.rows[0];
};

const remover = async (banhistaId, tipoId) => {
  const result = await query(
    'UPDATE tipos_animais SET ativo = false WHERE id = $1 AND banhista_id = $2 RETURNING id',
    [tipoId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tipo de animal nao encontrado', 404);
  }
};

module.exports = {
  listar,
  listarEspecies,
  listarRacasPorEspecie,
  criar,
  atualizar,
  remover
};
