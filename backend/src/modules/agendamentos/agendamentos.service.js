const pool = require('../../config/database');

const SELECT_BASE = `
  SELECT a.id,
         a.data_hora,
         a.status,
         a.origem,
         a.observacoes,
         a.valor_cobrado,
         a.criado_em,
         -- Cliente
         c.id   AS cliente_id,
         c.nome AS cliente_nome,
         c.telefone AS cliente_telefone,
         a.nome_avulso,
         a.telefone_avulso,
         -- Pet
         p.id   AS pet_id,
         p.nome AS pet_nome,
         a.pet_nome_avulso,
         -- Serviço
         s.id   AS servico_id,
         s.nome AS servico_nome,
         s.preco AS servico_preco,
         s.duracao_minutos
  FROM agendamentos a
  LEFT JOIN clientes c ON c.id = a.cliente_id
  LEFT JOIN pets     p ON p.id = a.pet_id
  JOIN servicos      s ON s.id = a.servico_id
`;

async function listar({ semana, status, pagina = 1, limite = 50 }) {
  const conditions = [];
  const params     = [];

  if (semana) {
    // semana = 'YYYY-WW' ou a data de início da semana
    params.push(semana);
    conditions.push(`DATE_TRUNC('week', a.data_hora AT TIME ZONE 'America/Sao_Paulo') = DATE_TRUNC('week', $${params.length}::date AT TIME ZONE 'America/Sao_Paulo')`);
  }
  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const where  = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (pagina - 1) * limite;
  params.push(limite, offset);

  const { rows } = await pool.query(
    `${SELECT_BASE} ${where} ORDER BY a.data_hora LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function agenda(dataInicio, dataFim) {
  const { rows } = await pool.query(
    `${SELECT_BASE}
     WHERE a.data_hora BETWEEN $1 AND $2
       AND a.status NOT IN ('cancelado')
     ORDER BY a.data_hora`,
    [dataInicio, dataFim]
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE a.id = $1`, [id]);
  if (!rows[0]) throw { status: 404, message: 'Agendamento não encontrado.' };
  return rows[0];
}

async function criarPeloCliente({ clienteId, petId, servicoId, dataHora, observacoes }) {
  // Valida pet pertence ao cliente
  const { rows: pet } = await pool.query(
    'SELECT id FROM pets WHERE id = $1 AND cliente_id = $2 AND ativo = TRUE',
    [petId, clienteId]
  );
  if (!pet[0]) throw { status: 400, message: 'Pet inválido.' };

  // Valida serviço ativo
  const { rows: srv } = await pool.query('SELECT preco FROM servicos WHERE id = $1 AND ativo = TRUE', [servicoId]);
  if (!srv[0]) throw { status: 400, message: 'Serviço inválido.' };

  const { rows } = await pool.query(
    `INSERT INTO agendamentos (cliente_id, pet_id, servico_id, data_hora, observacoes, valor_cobrado, origem)
     VALUES ($1,$2,$3,$4,$5,$6,'cliente') RETURNING id`,
    [clienteId, petId, servicoId, dataHora, observacoes || null, srv[0].preco]
  );
  return buscarPorId(rows[0].id);
}

async function criarPeloAdmin({ servicoId, dataHora, clienteId, petId, nomeAvulso, telefoneAvulso, petNomeAvulso, observacoes, valorCobrado }) {
  const { rows: srv } = await pool.query('SELECT preco FROM servicos WHERE id = $1', [servicoId]);
  if (!srv[0]) throw { status: 400, message: 'Serviço inválido.' };

  const { rows } = await pool.query(
    `INSERT INTO agendamentos
       (servico_id, data_hora, cliente_id, pet_id, nome_avulso, telefone_avulso, pet_nome_avulso, observacoes, valor_cobrado, origem)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'admin') RETURNING id`,
    [servicoId, dataHora, clienteId || null, petId || null, nomeAvulso || null,
     telefoneAvulso || null, petNomeAvulso || null, observacoes || null,
     valorCobrado ?? srv[0].preco]
  );
  return buscarPorId(rows[0].id);
}

async function atualizarStatus(id, status, valorCobrado) {
  const campos = ['status = $1'];
  const params = [status];
  if (valorCobrado !== undefined) {
    params.push(valorCobrado);
    campos.push(`valor_cobrado = $${params.length}`);
  }
  params.push(id);
  campos.push(`atualizado_em = NOW()`);

  const { rows } = await pool.query(
    `UPDATE agendamentos SET ${campos.join(', ')} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!rows[0]) throw { status: 404, message: 'Agendamento não encontrado.' };
  return buscarPorId(rows[0].id);
}

async function cancelarPeloCliente(id, clienteId) {
  const { rows } = await pool.query(
    `UPDATE agendamentos SET status = 'cancelado', atualizado_em = NOW()
     WHERE id = $1 AND cliente_id = $2 AND status = 'pendente' RETURNING id`,
    [id, clienteId]
  );
  if (!rows[0]) throw { status: 404, message: 'Agendamento não encontrado ou não pode ser cancelado.' };
  return buscarPorId(rows[0].id);
}

async function listarDoCliente(clienteId) {
  const { rows } = await pool.query(
    `${SELECT_BASE} WHERE a.cliente_id = $1 ORDER BY a.data_hora DESC`,
    [clienteId]
  );
  return rows;
}

async function buscarPorCpfOuTelefone(busca) {
  const digits = busca.replace(/\D/g, '');
  if (!digits) return [];
  const { rows } = await pool.query(
    `${SELECT_BASE}
     WHERE c.cpf = $1 OR regexp_replace(COALESCE(c.telefone,''), '[^0-9]', '', 'g') = $1
     ORDER BY a.data_hora DESC LIMIT 50`,
    [digits]
  );
  return rows;
}

module.exports = { listar, agenda, buscarPorId, criarPeloCliente, criarPeloAdmin, atualizarStatus, cancelarPeloCliente, listarDoCliente, buscarPorCpfOuTelefone };
