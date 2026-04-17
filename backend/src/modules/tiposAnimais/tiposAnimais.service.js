const pool = require('../../config/database');

async function listar() {
  const { rows } = await pool.query(
    'SELECT id, nome, ativo FROM tipos_animais ORDER BY nome'
  );
  return rows;
}

async function criar(nome) {
  const { rows } = await pool.query(
    'INSERT INTO tipos_animais (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING *',
    [nome.trim()]
  );
  if (!rows[0]) throw { status: 409, message: 'Tipo de animal já existe.' };
  return rows[0];
}

async function atualizar(id, { nome, ativo }) {
  const { rows } = await pool.query(
    'UPDATE tipos_animais SET nome = COALESCE($1, nome), ativo = COALESCE($2, ativo) WHERE id = $3 RETURNING *',
    [nome || null, ativo !== undefined ? ativo : null, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Tipo de animal não encontrado.' };
  return rows[0];
}

async function remover(id) {
  await pool.query('UPDATE tipos_animais SET ativo = FALSE WHERE id = $1', [id]);
}

module.exports = { listar, criar, atualizar, remover };
