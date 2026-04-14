const { query } = require('../../config/database');

const getResumo = async (banhistaId) => {
  // Faturamento do mes atual (pagos)
  const faturadoResult = await query(
    `SELECT COALESCE(SUM(preco), 0) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND pago = true
       AND DATE_TRUNC('month', data_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
    [banhistaId]
  );

  // A receber (concluidos nao pagos)
  const aReceberResult = await query(
    `SELECT COALESCE(SUM(preco), 0) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND pago = false`,
    [banhistaId]
  );

  // Total de agendamentos do mes
  const totalAgendamentosResult = await query(
    `SELECT COUNT(*) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND DATE_TRUNC('month', data_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
    [banhistaId]
  );

  // Nome do mes atual
  const dataAtual = new Date();
  const nomeMes = dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return {
    mes: nomeMes,
    faturado: parseFloat(faturadoResult.rows[0].total),
    aReceber: parseFloat(aReceberResult.rows[0].total),
    totalAgendamentos: parseInt(totalAgendamentosResult.rows[0].total)
  };
};

const getHistorico = async (banhistaId, meses) => {
  const result = await query(
    `SELECT
       DATE_TRUNC('month', data_hora) as mes,
       COALESCE(SUM(CASE WHEN pago = true THEN preco ELSE 0 END), 0) as faturado,
       COUNT(*) as total_agendamentos
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND data_hora >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${meses - 1} months'
     GROUP BY DATE_TRUNC('month', data_hora)
     ORDER BY mes DESC`,
    [banhistaId]
  );

  return result.rows.map(r => ({
    mes: r.mes,
    mesFormatado: new Date(r.mes).toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
    faturado: parseFloat(r.faturado),
    totalAgendamentos: parseInt(r.total_agendamentos)
  }));
};

const getPendentes = async (banhistaId) => {
  const result = await query(
    `SELECT a.id, a.data_hora, a.preco,
            p.nome as pet_nome,
            c.nome as cliente_nome, c.telefone as cliente_telefone,
            s.nome as servico_nome
     FROM agendamentos a
     LEFT JOIN pets p ON p.id = a.pet_id
     LEFT JOIN clientes c ON c.id = a.cliente_id
     LEFT JOIN servicos s ON s.id = a.servico_id
     WHERE a.banhista_id = $1
       AND a.status = 'concluido'
       AND a.pago = false
     ORDER BY a.data_hora DESC`,
    [banhistaId]
  );

  const totalResult = await query(
    `SELECT COALESCE(SUM(preco), 0) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND pago = false`,
    [banhistaId]
  );

  return {
    total: parseFloat(totalResult.rows[0].total),
    agendamentos: result.rows.map(a => ({
      id: a.id,
      dataHora: a.data_hora,
      preco: a.preco,
      petNome: a.pet_nome,
      clienteNome: a.cliente_nome,
      clienteTelefone: a.cliente_telefone,
      servicoNome: a.servico_nome
    }))
  };
};

module.exports = {
  getResumo,
  getHistorico,
  getPendentes
};
