const { query, getClient } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const formatarAgendamento = (a) => ({
  id: a.id,
  dataHora: a.data_hora,
  duracaoMin: a.duracao_min,
  preco: a.preco,
  status: a.status,
  observacoes: a.observacoes,
  pet: a.pet_id ? {
    id: a.pet_id,
    nome: a.pet_nome,
    raca: a.pet_raca,
    tamanho: a.pet_tamanho
  } : null,
  servico: a.servico_id ? {
    id: a.servico_id,
    nome: a.servico_nome
  } : null,
  criadoEm: a.criado_em
});

// ========== AGENDAMENTOS ==========

const listarAgendamentos = async (clienteId) => {
  const sql = `
    SELECT a.*,
           p.nome as pet_nome, p.raca as pet_raca, p.tamanho as pet_tamanho,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.cliente_id = $1
    ORDER BY a.data_hora DESC
  `;

  const result = await query(sql, [clienteId]);
  return result.rows.map(formatarAgendamento);
};

const listarAgendamentosFuturos = async (clienteId) => {
  const sql = `
    SELECT a.*,
           p.nome as pet_nome, p.raca as pet_raca, p.tamanho as pet_tamanho,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.cliente_id = $1
      AND a.data_hora >= NOW()
      AND a.status NOT IN ('cancelado', 'concluido')
    ORDER BY a.data_hora ASC
  `;

  const result = await query(sql, [clienteId]);
  return result.rows.map(formatarAgendamento);
};

const criarAgendamento = async (clienteId, banhistaId, dados) => {
  // Verificar se pet pertence ao cliente
  const petCheck = await query(
    'SELECT id, tamanho FROM pets WHERE id = $1 AND cliente_id = $2',
    [dados.petId, clienteId]
  );

  if (petCheck.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  const pet = petCheck.rows[0];

  // Buscar servico e preco baseado no tamanho do pet
  const servicoCheck = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante
     FROM servicos WHERE id = $1 AND banhista_id = $2 AND ativo = true`,
    [dados.servicoId, banhistaId]
  );

  if (servicoCheck.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const servico = servicoCheck.rows[0];

  // Calcular preco baseado no tamanho do pet
  let preco = servico.preco_medio;
  if (pet.tamanho === 'pequeno') preco = servico.preco_pequeno;
  else if (pet.tamanho === 'medio') preco = servico.preco_medio;
  else if (pet.tamanho === 'grande') preco = servico.preco_grande;
  else if (pet.tamanho === 'gigante') preco = servico.preco_gigante;

  const dataHora = new Date(dados.dataHora);
  const dataFim = new Date(dataHora);
  dataFim.setMinutes(dataFim.getMinutes() + servico.duracao_min);

  // Usar transacao com SELECT FOR UPDATE para evitar race condition
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Bloquear registros de agendamentos que possam conflitar (FOR UPDATE)
    const conflitoCheck = await client.query(
      `SELECT id FROM agendamentos
       WHERE banhista_id = $1
         AND status != 'cancelado'
         AND (
           (data_hora <= $2 AND data_hora + (duracao_min || ' minutes')::interval > $2)
           OR (data_hora < $3 AND data_hora + (duracao_min || ' minutes')::interval >= $3)
           OR (data_hora >= $2 AND data_hora + (duracao_min || ' minutes')::interval <= $3)
         )
       FOR UPDATE`,
      [banhistaId, dataHora.toISOString(), dataFim.toISOString()]
    );

    if (conflitoCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      throw new AppError('Este horario acabou de ser reservado por outro cliente. Por favor, escolha outro horario.', 409);
    }

    // Criar agendamento dentro da transacao
    const result = await client.query(
      `INSERT INTO agendamentos (banhista_id, pet_id, cliente_id, servico_id, data_hora, duracao_min, preco, observacoes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'agendado')
       RETURNING *`,
      [banhistaId, dados.petId, clienteId, dados.servicoId, dados.dataHora, servico.duracao_min, preco, dados.observacoes || null]
    );

    await client.query('COMMIT');

    const agendamento = result.rows[0];

    // Buscar dados completos (fora da transacao)
    const sql = `
      SELECT a.*,
             p.nome as pet_nome, p.raca as pet_raca, p.tamanho as pet_tamanho,
             s.nome as servico_nome
      FROM agendamentos a
      LEFT JOIN pets p ON p.id = a.pet_id
      LEFT JOIN servicos s ON s.id = a.servico_id
      WHERE a.id = $1
    `;

    const resultFinal = await query(sql, [agendamento.id]);
    return formatarAgendamento(resultFinal.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cancelarAgendamento = async (clienteId, agendamentoId) => {
  // Verificar se agendamento pertence ao cliente e pode ser cancelado
  const check = await query(
    `SELECT id, status, data_hora FROM agendamentos
     WHERE id = $1 AND cliente_id = $2`,
    [agendamentoId, clienteId]
  );

  if (check.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  const agendamento = check.rows[0];

  if (agendamento.status === 'cancelado') {
    throw new AppError('Agendamento ja foi cancelado', 400);
  }

  if (agendamento.status === 'concluido') {
    throw new AppError('Agendamento ja foi concluido', 400);
  }

  if (agendamento.status === 'em_andamento') {
    throw new AppError('Agendamento em andamento nao pode ser cancelado', 400);
  }

  // Verificar se nao e muito em cima da hora (minimo 2 horas de antecedencia)
  const dataAgendamento = new Date(agendamento.data_hora);
  const agora = new Date();
  const diffHoras = (dataAgendamento - agora) / (1000 * 60 * 60);

  if (diffHoras < 2) {
    throw new AppError('Cancelamento deve ser feito com pelo menos 2 horas de antecedencia', 400);
  }

  await query(
    `UPDATE agendamentos SET status = 'cancelado', atualizado_em = NOW() WHERE id = $1`,
    [agendamentoId]
  );

  return { message: 'Agendamento cancelado com sucesso' };
};

// ========== PETS ==========

const listarPets = async (clienteId) => {
  const result = await query(
    `SELECT id, nome, especie, raca, tamanho, peso_kg, foto_url, observacoes, criado_em
     FROM pets
     WHERE cliente_id = $1
     ORDER BY nome ASC`,
    [clienteId]
  );

  return result.rows.map(p => ({
    id: p.id,
    nome: p.nome,
    especie: p.especie,
    raca: p.raca,
    tamanho: p.tamanho,
    pesoKg: p.peso_kg,
    fotoUrl: p.foto_url,
    observacoes: p.observacoes,
    criadoEm: p.criado_em
  }));
};

const criarPet = async (clienteId, banhistaId, dados) => {
  const result = await query(
    `INSERT INTO pets (banhista_id, cliente_id, nome, especie, raca, tamanho, peso_kg, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [banhistaId, clienteId, dados.nome, dados.especie || 'cachorro', dados.raca, dados.tamanho || 'medio', dados.pesoKg, dados.observacoes]
  );

  const pet = result.rows[0];
  return {
    id: pet.id,
    nome: pet.nome,
    especie: pet.especie,
    raca: pet.raca,
    tamanho: pet.tamanho,
    pesoKg: pet.peso_kg,
    observacoes: pet.observacoes
  };
};

// ========== PERFIL ==========

const obterPerfil = async (clienteId) => {
  const result = await query(
    `SELECT id, nome, telefone, email_auth, cpf, criado_em
     FROM clientes
     WHERE id = $1`,
    [clienteId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Perfil nao encontrado', 404);
  }

  const c = result.rows[0];
  return {
    id: c.id,
    nome: c.nome,
    email: c.email_auth,
    telefone: c.telefone,
    cpf: c.cpf,
    criadoEm: c.criado_em
  };
};

const atualizarPerfil = async (clienteId, dados) => {
  const updates = [];
  const values = [clienteId];
  let paramCount = 1;

  if (dados.nome) {
    paramCount++;
    updates.push(`nome = $${paramCount}`);
    values.push(dados.nome);
  }

  if (dados.telefone) {
    paramCount++;
    updates.push(`telefone = $${paramCount}`);
    values.push(dados.telefone);
  }

  if (updates.length === 0) {
    return obterPerfil(clienteId);
  }

  updates.push('atualizado_em = NOW()');

  await query(
    `UPDATE clientes SET ${updates.join(', ')} WHERE id = $1`,
    values
  );

  return obterPerfil(clienteId);
};

module.exports = {
  listarAgendamentos,
  listarAgendamentosFuturos,
  criarAgendamento,
  cancelarAgendamento,
  listarPets,
  criarPet,
  obterPerfil,
  atualizarPerfil
};
