const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const INTERVALO_MIN = 30; // granularidade dos slots em minutos

// ─── Regras semanais ──────────────────────────────────────────────────────────

const listarRegras = async (banhistaId) => {
  const result = await query(
    `SELECT id, day_of_week, start_time, end_time, ativo
     FROM availability_rules
     WHERE banhista_id = $1
     ORDER BY day_of_week, start_time`,
    [banhistaId]
  );
  return result.rows;
};

// Substitui todas as regras do banhista de uma vez (mais simples que upsert individual)
const atualizarRegras = async (banhistaId, regras) => {
  await query('DELETE FROM availability_rules WHERE banhista_id = $1', [banhistaId]);

  if (!regras || regras.length === 0) return [];

  const placeholders = regras.map((_, i) => {
    const b = i * 4;
    return `($${b + 1}, $${b + 2}, $${b + 3}::TIME, $${b + 4}::TIME)`;
  }).join(', ');

  const params = regras.flatMap(r => [
    banhistaId,
    r.dayOfWeek,
    r.startTime,
    r.endTime
  ]);

  const result = await query(
    `INSERT INTO availability_rules (banhista_id, day_of_week, start_time, end_time)
     VALUES ${placeholders}
     RETURNING id, day_of_week, start_time, end_time, ativo`,
    params
  );

  return result.rows;
};

// ─── Bloqueios ────────────────────────────────────────────────────────────────

const listarBloqueios = async (banhistaId, apenasAtivos = false) => {
  let sql = `
    SELECT id, starts_at, ends_at, reason, criado_em
    FROM blocked_periods
    WHERE banhista_id = $1
  `;
  if (apenasAtivos) sql += ' AND ends_at > NOW()';
  sql += ' ORDER BY starts_at ASC';

  const result = await query(sql, [banhistaId]);
  return result.rows;
};

const criarBloqueio = async (banhistaId, { startsAt, endsAt, reason }) => {
  const result = await query(
    `INSERT INTO blocked_periods (banhista_id, starts_at, ends_at, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id, starts_at, ends_at, reason, criado_em`,
    [banhistaId, startsAt, endsAt, reason || null]
  );
  return result.rows[0];
};

const removerBloqueio = async (banhistaId, bloqueioId) => {
  const result = await query(
    `DELETE FROM blocked_periods WHERE id = $1 AND banhista_id = $2 RETURNING id`,
    [bloqueioId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Bloqueio nao encontrado', 404);
  }
};

// ─── Motor de slots ───────────────────────────────────────────────────────────

// Calcula slots disponíveis para uma data e duração de serviço.
// Usado tanto pelas rotas públicas (cliente) quanto pelo admin (agenda).
const calcularSlots = async (banhistaId, data, duracaoMin) => {
  const dataBase = new Date(data + 'T00:00:00');
  const dayOfWeek = dataBase.getDay(); // 0=dom, 1=seg, ..., 6=sab

  // 1. Regras do dia da semana
  const regrasResult = await query(
    `SELECT start_time, end_time
     FROM availability_rules
     WHERE banhista_id = $1 AND day_of_week = $2 AND ativo = true
     ORDER BY start_time`,
    [banhistaId, dayOfWeek]
  );

  if (regrasResult.rows.length === 0) {
    return []; // Dia sem atendimento configurado
  }

  // 2. Bloqueios que se sobrepõem ao dia
  const diaInicio = new Date(data + 'T00:00:00');
  const diaFim = new Date(data + 'T23:59:59');

  const bloqueiosResult = await query(
    `SELECT starts_at, ends_at FROM blocked_periods
     WHERE banhista_id = $1
       AND starts_at < $3
       AND ends_at > $2`,
    [banhistaId, diaInicio.toISOString(), diaFim.toISOString()]
  );

  // 3. Agendamentos ativos do dia
  const agendamentosResult = await query(
    `SELECT data_hora, ends_at FROM agendamentos
     WHERE banhista_id = $1
       AND data_hora < $3
       AND ends_at > $2
       AND status IN ('agendado', 'confirmado', 'em_andamento')`,
    [banhistaId, diaInicio.toISOString(), diaFim.toISOString()]
  );

  const bloqueios = bloqueiosResult.rows;
  const agendamentos = agendamentosResult.rows;

  // 4. Gerar slots dentro de cada janela de atendimento
  const slots = [];

  for (const regra of regrasResult.rows) {
    // TIME vem como "HH:MM:SS" do pg
    const [hIni, mIni] = regra.start_time.split(':').map(Number);
    const [hFim, mFim] = regra.end_time.split(':').map(Number);

    const janelaFim = new Date(dataBase);
    janelaFim.setHours(hFim, mFim, 0, 0);

    let cursor = new Date(dataBase);
    cursor.setHours(hIni, mIni, 0, 0);

    while (cursor < janelaFim) {
      const slotFim = new Date(cursor.getTime() + duracaoMin * 60000);

      // Slot deve terminar dentro da janela de atendimento
      if (slotFim > janelaFim) break;

      const bloqueado = bloqueios.some(b =>
        cursor < new Date(b.ends_at) && slotFim > new Date(b.starts_at)
      );

      const ocupado = agendamentos.some(a =>
        cursor < new Date(a.ends_at) && slotFim > new Date(a.data_hora)
      );

      if (!bloqueado && !ocupado) {
        slots.push({
          hora: cursor.toTimeString().slice(0, 5),
          dataHora: cursor.toISOString()
        });
      }

      cursor = new Date(cursor.getTime() + INTERVALO_MIN * 60000);
    }
  }

  slots.sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  return slots;
};

module.exports = {
  listarRegras,
  atualizarRegras,
  listarBloqueios,
  criarBloqueio,
  removerBloqueio,
  calcularSlots
};
