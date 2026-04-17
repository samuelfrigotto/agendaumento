const pool = require('../../config/database');

async function listar({ pagina = 1, limite = 20, busca = '' }) {
  const offset = (pagina - 1) * limite;
  const like   = `%${busca}%`;

  const { rows } = await pool.query(
    `SELECT id, nome, cpf, telefone, email, endereco, ativo, criado_em
     FROM clientes
     WHERE nome ILIKE $1 OR cpf ILIKE $1 OR email ILIKE $1
     ORDER BY nome
     LIMIT $2 OFFSET $3`,
    [like, limite, offset]
  );

  const { rows: total } = await pool.query(
    'SELECT COUNT(*) FROM clientes WHERE nome ILIKE $1 OR cpf ILIKE $1 OR email ILIKE $1',
    [like]
  );

  return { dados: rows, total: parseInt(total[0].count), pagina, limite };
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    'SELECT id, nome, cpf, telefone, email, endereco, ativo, criado_em FROM clientes WHERE id = $1',
    [id]
  );
  if (!rows[0]) throw { status: 404, message: 'Cliente não encontrado.' };
  return rows[0];
}

async function pets(clienteId) {
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

async function desativar(id) {
  await pool.query('UPDATE clientes SET ativo = FALSE WHERE id = $1', [id]);
}

module.exports = { listar, buscarPorId, pets, desativar };
