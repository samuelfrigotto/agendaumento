const pool = require('../../config/database');

async function resumo({ mes, ano }) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'concluido')                AS total_concluidos,
       COUNT(*) FILTER (WHERE status = 'cancelado')                AS total_cancelados,
       COUNT(*) FILTER (WHERE status IN ('pendente','confirmado')) AS total_pendentes,
       COALESCE(SUM(valor_cobrado) FILTER (WHERE status = 'concluido'), 0) AS receita_total
     FROM agendamentos
     WHERE EXTRACT(MONTH FROM data_hora AT TIME ZONE 'America/Sao_Paulo') = $1
       AND EXTRACT(YEAR  FROM data_hora AT TIME ZONE 'America/Sao_Paulo') = $2`,
    [mes, ano]
  );
  const r = rows[0];
  // pg retorna COUNT e SUM como strings — convertemos explicitamente
  return {
    total_concluidos: parseInt(r.total_concluidos, 10),
    total_cancelados: parseInt(r.total_cancelados, 10),
    total_pendentes:  parseInt(r.total_pendentes,  10),
    receita_total:    parseFloat(r.receita_total),
  };
}

async function listarServicos({ mes, ano, status, pagina = 1, limite = 50 }) {
  const conditions = [
    `EXTRACT(MONTH FROM a.data_hora AT TIME ZONE 'America/Sao_Paulo') = $1`,
    `EXTRACT(YEAR  FROM a.data_hora AT TIME ZONE 'America/Sao_Paulo') = $2`,
  ];
  const params = [mes, ano];

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const offset = (pagina - 1) * limite;
  params.push(limite, offset);

  const { rows } = await pool.query(
    `SELECT a.id, a.data_hora, a.status, a.valor_cobrado, a.origem,
            COALESCE(c.nome, a.nome_avulso) AS cliente_nome,
            COALESCE(p.nome, a.pet_nome_avulso) AS pet_nome,
            s.nome AS servico_nome
     FROM agendamentos a
     LEFT JOIN clientes c ON c.id = a.cliente_id
     LEFT JOIN pets p ON p.id = a.pet_id
     JOIN servicos s ON s.id = a.servico_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.data_hora DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function tendenciaMensal() {
  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', data_hora AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM') AS mes,
       COUNT(*) FILTER (WHERE status = 'concluido')  AS total_concluidos,
       COUNT(*)                                       AS total,
       COALESCE(SUM(valor_cobrado) FILTER (WHERE status = 'concluido'), 0) AS receita
     FROM agendamentos
     WHERE data_hora >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
     GROUP BY mes
     ORDER BY mes`
  );
  return rows.map(r => ({
    mes: r.mes,
    total_concluidos: parseInt(r.total_concluidos, 10),
    total: parseInt(r.total, 10),
    receita: parseFloat(r.receita),
  }));
}

async function porServico({ mes, ano }) {
  const { rows } = await pool.query(
    `SELECT s.nome AS servico_nome,
            COUNT(*) FILTER (WHERE a.status = 'concluido') AS total_concluidos,
            COALESCE(SUM(a.valor_cobrado) FILTER (WHERE a.status = 'concluido'), 0) AS receita
     FROM agendamentos a
     JOIN servicos s ON s.id = a.servico_id
     WHERE EXTRACT(MONTH FROM a.data_hora AT TIME ZONE 'America/Sao_Paulo') = $1
       AND EXTRACT(YEAR  FROM a.data_hora AT TIME ZONE 'America/Sao_Paulo') = $2
     GROUP BY s.nome
     ORDER BY receita DESC`,
    [mes, ano]
  );
  return rows.map(r => ({
    servico_nome: r.servico_nome,
    total_concluidos: parseInt(r.total_concluidos, 10),
    receita: parseFloat(r.receita),
  }));
}

module.exports = { resumo, listarServicos, tendenciaMensal, porServico };
