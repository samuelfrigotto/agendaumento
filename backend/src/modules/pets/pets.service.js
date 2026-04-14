const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { deleteImage } = require('../../middlewares/upload');

const listar = async (banhistaId, { page, limit, busca, clienteId }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT p.id, p.nome, p.especie, p.raca, p.tamanho, p.peso_kg, p.foto_url, p.observacoes, p.criado_em,
           c.id as cliente_id, c.nome as cliente_nome, c.telefone as cliente_telefone,
           MAX(a.data_hora) as ultimo_agendamento
    FROM pets p
    JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN agendamentos a ON a.pet_id = p.id
    WHERE p.banhista_id = $1
  `;
  const params = [banhistaId];

  if (clienteId) {
    sql += ` AND p.cliente_id = $${params.length + 1}`;
    params.push(clienteId);
  }

  if (busca) {
    sql += ` AND (p.nome ILIKE $${params.length + 1} OR p.raca ILIKE $${params.length + 1})`;
    params.push(`%${busca}%`);
  }

  sql += `
    GROUP BY p.id, c.id
    ORDER BY p.nome ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  const result = await query(sql, params);

  // Contar total
  let countSql = 'SELECT COUNT(*) FROM pets WHERE banhista_id = $1';
  const countParams = [banhistaId];
  if (clienteId) {
    countSql += ` AND cliente_id = $${countParams.length + 1}`;
    countParams.push(clienteId);
  }
  if (busca) {
    countSql += ` AND (nome ILIKE $${countParams.length + 1} OR raca ILIKE $${countParams.length + 1})`;
    countParams.push(`%${busca}%`);
  }
  const countResult = await query(countSql, countParams);

  return {
    data: result.rows.map(p => ({
      id: p.id,
      nome: p.nome,
      especie: p.especie,
      raca: p.raca,
      tamanho: p.tamanho,
      pesoKg: p.peso_kg,
      fotoUrl: p.foto_url,
      observacoes: p.observacoes,
      cliente: {
        id: p.cliente_id,
        nome: p.cliente_nome,
        telefone: p.cliente_telefone
      },
      ultimoAgendamento: p.ultimo_agendamento,
      criadoEm: p.criado_em
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
  // Verificar se cliente pertence a banhista
  const clienteCheck = await query(
    'SELECT id FROM clientes WHERE id = $1 AND banhista_id = $2',
    [dados.clienteId, banhistaId]
  );

  if (clienteCheck.rows.length === 0) {
    throw new AppError('Cliente nao encontrado', 404);
  }

  const result = await query(
    `INSERT INTO pets (banhista_id, cliente_id, nome, especie, raca, tamanho, peso_kg, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, nome, especie, raca, tamanho, peso_kg, foto_url, observacoes, criado_em`,
    [banhistaId, dados.clienteId, dados.nome, dados.especie || 'cachorro', dados.raca, dados.tamanho, dados.pesoKg, dados.observacoes]
  );

  const p = result.rows[0];
  return {
    id: p.id,
    nome: p.nome,
    especie: p.especie,
    raca: p.raca,
    tamanho: p.tamanho,
    pesoKg: p.peso_kg,
    fotoUrl: p.foto_url,
    observacoes: p.observacoes,
    criadoEm: p.criado_em
  };
};

const buscarPorId = async (banhistaId, petId) => {
  const result = await query(
    `SELECT p.id, p.nome, p.especie, p.raca, p.tamanho, p.peso_kg, p.foto_url, p.observacoes, p.criado_em,
            c.id as cliente_id, c.nome as cliente_nome, c.telefone as cliente_telefone
     FROM pets p
     JOIN clientes c ON c.id = p.cliente_id
     WHERE p.id = $1 AND p.banhista_id = $2`,
    [petId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  const p = result.rows[0];

  // Buscar historico de agendamentos
  const agendamentosResult = await query(
    `SELECT a.id, a.data_hora, a.status, a.preco, s.nome as servico_nome
     FROM agendamentos a
     LEFT JOIN servicos s ON s.id = a.servico_id
     WHERE a.pet_id = $1
     ORDER BY a.data_hora DESC
     LIMIT 10`,
    [petId]
  );

  return {
    id: p.id,
    nome: p.nome,
    especie: p.especie,
    raca: p.raca,
    tamanho: p.tamanho,
    pesoKg: p.peso_kg,
    fotoUrl: p.foto_url,
    observacoes: p.observacoes,
    cliente: {
      id: p.cliente_id,
      nome: p.cliente_nome,
      telefone: p.cliente_telefone
    },
    agendamentos: agendamentosResult.rows.map(a => ({
      id: a.id,
      dataHora: a.data_hora,
      status: a.status,
      preco: a.preco,
      servicoNome: a.servico_nome
    })),
    criadoEm: p.criado_em
  };
};

const atualizar = async (banhistaId, petId, dados) => {
  const result = await query(
    `UPDATE pets
     SET nome = COALESCE($3, nome),
         especie = COALESCE($4, especie),
         raca = $5,
         tamanho = $6,
         peso_kg = $7,
         observacoes = $8
     WHERE id = $1 AND banhista_id = $2
     RETURNING id, nome, especie, raca, tamanho, peso_kg, foto_url, observacoes`,
    [petId, banhistaId, dados.nome, dados.especie, dados.raca, dados.tamanho, dados.pesoKg, dados.observacoes]
  );

  if (result.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  const p = result.rows[0];
  return {
    id: p.id,
    nome: p.nome,
    especie: p.especie,
    raca: p.raca,
    tamanho: p.tamanho,
    pesoKg: p.peso_kg,
    fotoUrl: p.foto_url,
    observacoes: p.observacoes
  };
};

const atualizarFoto = async (banhistaId, petId, fotoUrl) => {
  // Buscar foto antiga para deletar
  const petAtual = await query(
    'SELECT foto_url FROM pets WHERE id = $1 AND banhista_id = $2',
    [petId, banhistaId]
  );

  if (petAtual.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  // Deletar foto antiga
  if (petAtual.rows[0].foto_url) {
    await deleteImage(petAtual.rows[0].foto_url);
  }

  const result = await query(
    `UPDATE pets SET foto_url = $3 WHERE id = $1 AND banhista_id = $2
     RETURNING id, nome, foto_url`,
    [petId, banhistaId, fotoUrl]
  );

  return {
    id: result.rows[0].id,
    nome: result.rows[0].nome,
    fotoUrl: result.rows[0].foto_url
  };
};

const remover = async (banhistaId, petId) => {
  // Buscar foto para deletar
  const pet = await query(
    'SELECT foto_url FROM pets WHERE id = $1 AND banhista_id = $2',
    [petId, banhistaId]
  );

  if (pet.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  const result = await query(
    'DELETE FROM pets WHERE id = $1 AND banhista_id = $2 RETURNING id',
    [petId, banhistaId]
  );

  if (result.rows.length > 0 && pet.rows[0].foto_url) {
    await deleteImage(pet.rows[0].foto_url);
  }
};

module.exports = {
  listar,
  criar,
  buscarPorId,
  atualizar,
  atualizarFoto,
  remover
};
