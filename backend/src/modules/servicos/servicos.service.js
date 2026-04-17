const pool = require('../../config/database');

async function _buscarCompleto(id) {
  const { rows } = await pool.query(
    `SELECT s.id, s.nome, s.descricao, s.preco, s.duracao_minutos, s.ativo, s.icon,
            COALESCE(
              json_agg(json_build_object('id', ta.id, 'nome', ta.nome))
                FILTER (WHERE ta.id IS NOT NULL), '[]'
            ) AS tipos_animais
     FROM servicos s
     LEFT JOIN servicos_tipos_animais sta ON sta.servico_id = s.id
     LEFT JOIN tipos_animais ta ON ta.id = sta.tipo_animal_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [id]
  );
  if (!rows[0]) throw { status: 404, message: 'Serviço não encontrado.' };
  return rows[0];
}

async function listar({ apenasAtivos = true } = {}) {
  const { rows } = await pool.query(
    `SELECT s.id, s.nome, s.descricao, s.preco, s.duracao_minutos, s.ativo, s.icon,
            COALESCE(
              json_agg(json_build_object('id', ta.id, 'nome', ta.nome))
                FILTER (WHERE ta.id IS NOT NULL), '[]'
            ) AS tipos_animais
     FROM servicos s
     LEFT JOIN servicos_tipos_animais sta ON sta.servico_id = s.id
     LEFT JOIN tipos_animais ta ON ta.id = sta.tipo_animal_id
     ${apenasAtivos ? 'WHERE s.ativo = TRUE' : ''}
     GROUP BY s.id
     ORDER BY s.nome`
  );
  return rows;
}

async function criar({ nome, descricao, preco, duracao_minutos, icon, tipos_animais }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO servicos (nome, descricao, preco, duracao_minutos, icon)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [nome, descricao || null, preco, duracao_minutos || 60, icon || 'scissors']
    );
    const id = rows[0].id;
    if (tipos_animais?.length) {
      for (const taId of tipos_animais) {
        await client.query(
          'INSERT INTO servicos_tipos_animais (servico_id, tipo_animal_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [id, taId]
        );
      }
    }
    await client.query('COMMIT');
    return _buscarCompleto(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizar(id, { nome, descricao, preco, duracao_minutos, ativo, icon, tipos_animais }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE servicos
       SET nome            = COALESCE($1, nome),
           descricao       = COALESCE($2, descricao),
           preco           = COALESCE($3, preco),
           duracao_minutos = COALESCE($4, duracao_minutos),
           ativo           = COALESCE($5, ativo),
           icon            = COALESCE($6, icon)
       WHERE id = $7 RETURNING id`,
      [nome||null, descricao||null, preco||null, duracao_minutos||null, ativo!==undefined?ativo:null, icon||null, id]
    );
    if (!rows[0]) throw { status: 404, message: 'Serviço não encontrado.' };
    if (tipos_animais !== undefined) {
      await client.query('DELETE FROM servicos_tipos_animais WHERE servico_id = $1', [id]);
      for (const taId of tipos_animais) {
        await client.query(
          'INSERT INTO servicos_tipos_animais (servico_id, tipo_animal_id) VALUES ($1,$2)',
          [id, taId]
        );
      }
    }
    await client.query('COMMIT');
    return _buscarCompleto(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function remover(id) {
  await pool.query('UPDATE servicos SET ativo = FALSE WHERE id = $1', [id]);
}

module.exports = { listar, criar, atualizar, remover, _buscarCompleto };
