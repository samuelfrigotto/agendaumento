const pool = require('../../config/database');

async function listarRegras() {
  const { rows } = await pool.query(
    'SELECT id, dia_semana, hora_inicio, hora_fim, ativo FROM disponibilidade ORDER BY dia_semana, hora_inicio'
  );
  return rows;
}

async function salvarRegras(regras) {
  // Substitui tudo (admin redefine disponibilidade inteira)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM disponibilidade');
    for (const r of regras) {
      await client.query(
        'INSERT INTO disponibilidade (dia_semana, hora_inicio, hora_fim, ativo) VALUES ($1,$2,$3,$4)',
        [r.dia_semana, r.hora_inicio, r.hora_fim, r.ativo !== false]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarBloqueados() {
  const { rows } = await pool.query(
    'SELECT id, data_inicio, data_fim, motivo FROM periodos_bloqueados ORDER BY data_inicio'
  );
  return rows;
}

async function adicionarBloqueio({ data_inicio, data_fim, motivo }) {
  const { rows } = await pool.query(
    'INSERT INTO periodos_bloqueados (data_inicio, data_fim, motivo) VALUES ($1,$2,$3) RETURNING *',
    [data_inicio, data_fim, motivo || null]
  );
  return rows[0];
}

async function removerBloqueio(id) {
  await pool.query('DELETE FROM periodos_bloqueados WHERE id = $1', [id]);
}

// Retorna slots disponíveis para uma data específica
async function slotsDisponiveis(dataStr, duracaoMinutos = 60) {
  const data  = new Date(dataStr + 'T00:00:00');
  const diaSemana = data.getDay(); // 0=dom

  // Verifica se a data está bloqueada
  const { rows: bloq } = await pool.query(
    `SELECT 1 FROM periodos_bloqueados
     WHERE data_inicio <= $1 AND data_fim >= $1`,
    [dataStr]
  );
  if (bloq.length > 0) return [];

  // Regras do dia
  const { rows: regras } = await pool.query(
    'SELECT hora_inicio, hora_fim FROM disponibilidade WHERE dia_semana = $1 AND ativo = TRUE',
    [diaSemana]
  );
  if (regras.length === 0) return [];

  // Agendamentos já marcados nesse dia
  const { rows: ocupados } = await pool.query(
    `SELECT data_hora, s.duracao_minutos
     FROM agendamentos a
     JOIN servicos s ON s.id = a.servico_id
     WHERE DATE(data_hora AT TIME ZONE 'America/Sao_Paulo') = $1
       AND a.status NOT IN ('cancelado')`,
    [dataStr]
  );

  const slots = [];
  for (const regra of regras) {
    const [hi, mi] = regra.hora_inicio.split(':').map(Number);
    const [hf, mf] = regra.hora_fim.split(':').map(Number);
    let cur = hi * 60 + mi;
    const fim = hf * 60 + mf;

    while (cur + duracaoMinutos <= fim) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0');
      const mm = String(cur % 60).padStart(2, '0');
      const slotStr = `${dataStr}T${hh}:${mm}:00-03:00`;
      const slotDt  = new Date(slotStr);

      // Verifica conflito
      const conflito = ocupados.some(o => {
        const oDt  = new Date(o.data_hora);
        const oFim = new Date(oDt.getTime() + o.duracao_minutos * 60000);
        const sFim = new Date(slotDt.getTime() + duracaoMinutos * 60000);
        return slotDt < oFim && sFim > oDt;
      });

      if (!conflito) slots.push(`${hh}:${mm}`);
      cur += duracaoMinutos;
    }
  }

  return slots;
}

module.exports = { listarRegras, salvarRegras, listarBloqueados, adicionarBloqueio, removerBloqueio, slotsDisponiveis };
