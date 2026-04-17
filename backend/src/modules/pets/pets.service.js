const pool = require('../../config/database');

async function listarDoCliente(clienteId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.nome, p.raca, p.idade, p.observacoes, p.ativo,
            ta.id AS tipo_animal_id, ta.nome AS tipo_animal
     FROM pets p
     JOIN tipos_animais ta ON ta.id = p.tipo_animal_id
     WHERE p.cliente_id = $1
     ORDER BY p.nome`,
    [clienteId]
  );
  return rows;
}

async function criar({ clienteId, tipo_animal_id, nome, raca, idade, observacoes }) {
  const { rows } = await pool.query(
    `INSERT INTO pets (cliente_id, tipo_animal_id, nome, raca, idade, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [clienteId, tipo_animal_id, nome, raca || null, idade || null, observacoes || null]
  );
  return rows[0];
}

async function atualizar(petId, clienteId, body) {
  const { tipo_animal_id, nome, raca, idade, observacoes, ativo } = body;

  const { rows } = await pool.query(
    `UPDATE pets
     SET tipo_animal_id = COALESCE($1, tipo_animal_id),
         nome           = COALESCE($2, nome),
         raca           = COALESCE($3, raca),
         idade          = COALESCE($4, idade),
         observacoes    = COALESCE($5, observacoes),
         ativo          = COALESCE($6, ativo)
     WHERE id = $7 AND cliente_id = $8
     RETURNING *`,
    [tipo_animal_id || null, nome || null, raca || null, idade || null,
     observacoes || null, ativo !== undefined ? ativo : null,
     petId, clienteId]
  );
  if (!rows[0]) throw { status: 404, message: 'Pet não encontrado.' };
  return rows[0];
}

async function remover(petId, clienteId) {
  await pool.query(
    'UPDATE pets SET ativo = FALSE WHERE id = $1 AND cliente_id = $2',
    [petId, clienteId]
  );
}

module.exports = { listarDoCliente, criar, atualizar, remover };
