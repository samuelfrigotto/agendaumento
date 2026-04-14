const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { enviarMensagemTexto, enviarMensagemComImagem } = require('../../config/whatsapp');

const formatarAgendamento = (a) => ({
  id: a.id,
  dataHora: a.data_hora,
  duracaoMin: a.duracao_min,
  preco: a.preco,
  status: a.status,
  observacoes: a.observacoes,
  avisoEnviado: a.aviso_enviado,
  fotoProntoUrl: a.foto_pronto_url,
  formaPagamento: a.forma_pagamento,
  pago: a.pago,
  pet: a.pet_id ? {
    id: a.pet_id,
    nome: a.pet_nome,
    especie: a.pet_especie,
    raca: a.pet_raca,
    tamanho: a.pet_tamanho,
    fotoUrl: a.pet_foto_url,
    observacoes: a.pet_observacoes
  } : null,
  cliente: a.cliente_id ? {
    id: a.cliente_id,
    nome: a.cliente_nome,
    telefone: a.cliente_telefone
  } : null,
  servico: a.servico_id ? {
    id: a.servico_id,
    nome: a.servico_nome
  } : null,
  criadoEm: a.criado_em
});

const listar = async (banhistaId, filtros) => {
  let sql = `
    SELECT a.*,
           p.nome as pet_nome, p.especie as pet_especie, p.raca as pet_raca, p.tamanho as pet_tamanho, p.foto_url as pet_foto_url, p.observacoes as pet_observacoes,
           c.nome as cliente_nome, c.telefone as cliente_telefone,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN clientes c ON c.id = a.cliente_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.banhista_id = $1
  `;
  const params = [banhistaId];

  if (filtros.dataInicio) {
    sql += ` AND a.data_hora >= $${params.length + 1}`;
    params.push(filtros.dataInicio);
  }

  if (filtros.dataFim) {
    sql += ` AND a.data_hora <= $${params.length + 1}`;
    params.push(filtros.dataFim);
  }

  if (filtros.status) {
    sql += ` AND a.status = $${params.length + 1}`;
    params.push(filtros.status);
  }

  if (filtros.petId) {
    sql += ` AND a.pet_id = $${params.length + 1}`;
    params.push(filtros.petId);
  }

  if (filtros.clienteId) {
    sql += ` AND a.cliente_id = $${params.length + 1}`;
    params.push(filtros.clienteId);
  }

  sql += ' ORDER BY a.data_hora ASC';

  const result = await query(sql, params);
  return result.rows.map(formatarAgendamento);
};

const listarHoje = async (banhistaId) => {
  const sql = `
    SELECT a.*,
           p.nome as pet_nome, p.especie as pet_especie, p.raca as pet_raca, p.tamanho as pet_tamanho, p.foto_url as pet_foto_url, p.observacoes as pet_observacoes,
           c.nome as cliente_nome, c.telefone as cliente_telefone,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN clientes c ON c.id = a.cliente_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.banhista_id = $1
      AND DATE(a.data_hora) = CURRENT_DATE
    ORDER BY a.data_hora ASC
  `;

  const result = await query(sql, [banhistaId]);
  return result.rows.map(formatarAgendamento);
};

const listarSemana = async (banhistaId, dataBase) => {
  const data = dataBase ? new Date(dataBase) : new Date();
  const diaSemana = data.getDay();
  const inicioSemana = new Date(data);
  inicioSemana.setDate(data.getDate() - diaSemana);
  inicioSemana.setHours(0, 0, 0, 0);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7);

  const sql = `
    SELECT a.*,
           p.nome as pet_nome, p.especie as pet_especie, p.raca as pet_raca, p.tamanho as pet_tamanho, p.foto_url as pet_foto_url, p.observacoes as pet_observacoes,
           c.nome as cliente_nome, c.telefone as cliente_telefone,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN clientes c ON c.id = a.cliente_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.banhista_id = $1
      AND a.data_hora >= $2
      AND a.data_hora < $3
    ORDER BY a.data_hora ASC
  `;

  const result = await query(sql, [banhistaId, inicioSemana.toISOString(), fimSemana.toISOString()]);

  return {
    inicioSemana: inicioSemana.toISOString(),
    fimSemana: fimSemana.toISOString(),
    agendamentos: result.rows.map(formatarAgendamento)
  };
};

const criar = async (banhistaId, dados) => {
  // Verificar se pet pertence a banhista
  const petCheck = await query(
    'SELECT id, cliente_id FROM pets WHERE id = $1 AND banhista_id = $2',
    [dados.petId, banhistaId]
  );

  if (petCheck.rows.length === 0) {
    throw new AppError('Pet nao encontrado', 404);
  }

  const clienteId = dados.clienteId || petCheck.rows[0].cliente_id;

  const result = await query(
    `INSERT INTO agendamentos (banhista_id, pet_id, cliente_id, servico_id, data_hora, duracao_min, preco, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [banhistaId, dados.petId, clienteId, dados.servicoId, dados.dataHora, dados.duracaoMin || 60, dados.preco, dados.observacoes]
  );

  return buscarPorId(banhistaId, result.rows[0].id);
};

const buscarPorId = async (banhistaId, agendamentoId) => {
  const sql = `
    SELECT a.*,
           p.nome as pet_nome, p.especie as pet_especie, p.raca as pet_raca, p.tamanho as pet_tamanho, p.foto_url as pet_foto_url, p.observacoes as pet_observacoes,
           c.nome as cliente_nome, c.telefone as cliente_telefone,
           s.nome as servico_nome
    FROM agendamentos a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN clientes c ON c.id = a.cliente_id
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE a.id = $1 AND a.banhista_id = $2
  `;

  const result = await query(sql, [agendamentoId, banhistaId]);

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  return formatarAgendamento(result.rows[0]);
};

const atualizar = async (banhistaId, agendamentoId, dados) => {
  const result = await query(
    `UPDATE agendamentos
     SET data_hora = COALESCE($3, data_hora),
         duracao_min = COALESCE($4, duracao_min),
         preco = COALESCE($5, preco),
         servico_id = $6,
         observacoes = $7,
         atualizado_em = NOW()
     WHERE id = $1 AND banhista_id = $2
     RETURNING id`,
    [agendamentoId, banhistaId, dados.dataHora, dados.duracaoMin, dados.preco, dados.servicoId, dados.observacoes]
  );

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  return buscarPorId(banhistaId, agendamentoId);
};

const atualizarStatus = async (banhistaId, agendamentoId, status) => {
  const statusValidos = ['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado'];

  if (!statusValidos.includes(status)) {
    throw new AppError('Status invalido', 400);
  }

  const result = await query(
    `UPDATE agendamentos
     SET status = $3, atualizado_em = NOW()
     WHERE id = $1 AND banhista_id = $2
     RETURNING id`,
    [agendamentoId, banhistaId, status]
  );

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  return buscarPorId(banhistaId, agendamentoId);
};

const marcarPago = async (banhistaId, agendamentoId, formaPagamento) => {
  const result = await query(
    `UPDATE agendamentos
     SET pago = true, forma_pagamento = $3, atualizado_em = NOW()
     WHERE id = $1 AND banhista_id = $2
     RETURNING id`,
    [agendamentoId, banhistaId, formaPagamento || 'dinheiro']
  );

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  return buscarPorId(banhistaId, agendamentoId);
};

const cancelar = async (banhistaId, agendamentoId) => {
  const result = await query(
    `UPDATE agendamentos
     SET status = 'cancelado', atualizado_em = NOW()
     WHERE id = $1 AND banhista_id = $2
     RETURNING id`,
    [agendamentoId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }
};

const avisarPronto = async (banhistaId, agendamentoId) => {
  const agendamento = await buscarPorId(banhistaId, agendamentoId);

  if (!agendamento.cliente?.telefone) {
    throw new AppError('Cliente nao tem telefone cadastrado', 400);
  }

  // Buscar nome do negocio
  const banhistaResult = await query(
    'SELECT nome_negocio, nome FROM banhistas WHERE id = $1',
    [banhistaId]
  );
  const nomeNegocio = banhistaResult.rows[0]?.nome_negocio || banhistaResult.rows[0]?.nome || 'Pet Shop';

  const mensagem = `${agendamento.cliente.nome}, o ${agendamento.pet.nome} ta lindo e pronto pra ir pra casa!\n\nPode vir buscar quando quiser.\n\nObrigada pela preferencia!\n- ${nomeNegocio}`;

  try {
    if (agendamento.fotoProntoUrl) {
      const fotoUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${agendamento.fotoProntoUrl}`;
      await enviarMensagemComImagem(agendamento.cliente.telefone, mensagem, fotoUrl);
    } else {
      await enviarMensagemTexto(agendamento.cliente.telefone, mensagem);
    }

    // Marcar como enviado
    await query(
      'UPDATE agendamentos SET aviso_enviado = true, atualizado_em = NOW() WHERE id = $1',
      [agendamentoId]
    );

    // Registrar log
    await query(
      `INSERT INTO mensagens_whatsapp (banhista_id, agendamento_id, telefone_destino, tipo, mensagem, status)
       VALUES ($1, $2, $3, 'pronto', $4, 'enviado')`,
      [banhistaId, agendamentoId, agendamento.cliente.telefone, mensagem]
    );

    return { success: true, message: 'Mensagem enviada com sucesso' };
  } catch (error) {
    // Registrar falha
    await query(
      `INSERT INTO mensagens_whatsapp (banhista_id, agendamento_id, telefone_destino, tipo, mensagem, status)
       VALUES ($1, $2, $3, 'pronto', $4, 'falhou')`,
      [banhistaId, agendamentoId, agendamento.cliente.telefone, mensagem]
    );

    throw new AppError('Erro ao enviar mensagem WhatsApp: ' + error.message, 500);
  }
};

const atualizarFotoPronto = async (banhistaId, agendamentoId, fotoUrl) => {
  const result = await query(
    `UPDATE agendamentos
     SET foto_pronto_url = $3, atualizado_em = NOW()
     WHERE id = $1 AND banhista_id = $2
     RETURNING id`,
    [agendamentoId, banhistaId, fotoUrl]
  );

  if (result.rows.length === 0) {
    throw new AppError('Agendamento nao encontrado', 404);
  }

  return buscarPorId(banhistaId, agendamentoId);
};

module.exports = {
  listar,
  listarHoje,
  listarSemana,
  criar,
  buscarPorId,
  atualizar,
  atualizarStatus,
  marcarPago,
  cancelar,
  avisarPronto,
  atualizarFotoPronto
};
