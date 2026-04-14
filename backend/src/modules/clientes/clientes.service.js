const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const listar = async (banhistaId, { page, limit, busca }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT c.id, c.nome, c.telefone, c.email, c.observacoes, c.criado_em,
           COUNT(p.id) as qtd_pets,
           MAX(a.data_hora) as ultimo_agendamento
    FROM clientes c
    LEFT JOIN pets p ON p.cliente_id = c.id
    LEFT JOIN agendamentos a ON a.cliente_id = c.id
    WHERE c.banhista_id = $1
  `;
  const params = [banhistaId];

  if (busca) {
    sql += ` AND (c.nome ILIKE $${params.length + 1} OR c.telefone ILIKE $${params.length + 1})`;
    params.push(`%${busca}%`);
  }

  sql += `
    GROUP BY c.id
    ORDER BY c.nome ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  const result = await query(sql, params);

  // Contar total
  let countSql = 'SELECT COUNT(*) FROM clientes WHERE banhista_id = $1';
  const countParams = [banhistaId];
  if (busca) {
    countSql += ' AND (nome ILIKE $2 OR telefone ILIKE $2)';
    countParams.push(`%${busca}%`);
  }
  const countResult = await query(countSql, countParams);

  return {
    data: result.rows.map(c => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      observacoes: c.observacoes,
      qtdPets: parseInt(c.qtd_pets),
      ultimoAgendamento: c.ultimo_agendamento,
      criadoEm: c.criado_em
    })),
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    }
  };
};

const criar = async (banhistaId, dados) => {
  const result = await query(
    `INSERT INTO clientes (banhista_id, nome, telefone, email, observacoes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nome, telefone, email, observacoes, criado_em`,
    [banhistaId, dados.nome, dados.telefone, dados.email, dados.observacoes]
  );

  const c = result.rows[0];
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    observacoes: c.observacoes,
    criadoEm: c.criado_em
  };
};

const buscarPorId = async (banhistaId, clienteId) => {
  const result = await query(
    `SELECT id, nome, telefone, email, observacoes, criado_em
     FROM clientes WHERE id = $1 AND banhista_id = $2`,
    [clienteId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Cliente nao encontrado', 404);
  }

  const c = result.rows[0];

  // Buscar pets do cliente
  const petsResult = await query(
    `SELECT id, nome, especie, raca, tamanho, foto_url
     FROM pets WHERE cliente_id = $1`,
    [clienteId]
  );

  // Buscar historico de agendamentos
  const agendamentosResult = await query(
    `SELECT a.id, a.data_hora, a.status, a.preco, a.pago,
            p.nome as pet_nome, s.nome as servico_nome
     FROM agendamentos a
     LEFT JOIN pets p ON p.id = a.pet_id
     LEFT JOIN servicos s ON s.id = a.servico_id
     WHERE a.cliente_id = $1
     ORDER BY a.data_hora DESC
     LIMIT 10`,
    [clienteId]
  );

  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    observacoes: c.observacoes,
    criadoEm: c.criado_em,
    pets: petsResult.rows.map(p => ({
      id: p.id,
      nome: p.nome,
      especie: p.especie,
      raca: p.raca,
      tamanho: p.tamanho,
      fotoUrl: p.foto_url
    })),
    agendamentos: agendamentosResult.rows.map(a => ({
      id: a.id,
      dataHora: a.data_hora,
      status: a.status,
      preco: a.preco,
      pago: a.pago,
      petNome: a.pet_nome,
      servicoNome: a.servico_nome
    }))
  };
};

const atualizar = async (banhistaId, clienteId, dados) => {
  const result = await query(
    `UPDATE clientes
     SET nome = COALESCE($3, nome),
         telefone = COALESCE($4, telefone),
         email = $5,
         observacoes = $6
     WHERE id = $1 AND banhista_id = $2
     RETURNING id, nome, telefone, email, observacoes`,
    [clienteId, banhistaId, dados.nome, dados.telefone, dados.email, dados.observacoes]
  );

  if (result.rows.length === 0) {
    throw new AppError('Cliente nao encontrado', 404);
  }

  const c = result.rows[0];
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    observacoes: c.observacoes
  };
};

const remover = async (banhistaId, clienteId) => {
  const result = await query(
    'DELETE FROM clientes WHERE id = $1 AND banhista_id = $2 RETURNING id',
    [clienteId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Cliente nao encontrado', 404);
  }
};

module.exports = {
  listar,
  criar,
  buscarPorId,
  atualizar,
  remover
};
