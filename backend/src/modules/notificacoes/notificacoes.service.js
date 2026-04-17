const pool    = require('../../config/database');
const email   = require('./email.service');
const whatsapp= require('./whatsapp.service');

function formatarData(dataHora) {
  return new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function jaEnviou(agendamentoId, tipo, momento) {
  const { rows } = await pool.query(
    'SELECT 1 FROM notificacoes WHERE agendamento_id=$1 AND tipo=$2 AND momento=$3',
    [agendamentoId, tipo, momento]
  );
  return rows.length > 0;
}

async function registrar(agendamentoId, tipo, momento) {
  await pool.query(
    `INSERT INTO notificacoes (agendamento_id, tipo, momento)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [agendamentoId, tipo, momento]
  );
}

async function processarLote(momento) {
  // momento = 'dia_antes' | '2h_antes'
  let windowStart, windowEnd;
  const agora = new Date();

  if (momento === 'dia_antes') {
    // Agendamentos amanhã inteiro
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    windowStart = new Date(amanha.setHours(0,0,0,0)).toISOString();
    windowEnd   = new Date(amanha.setHours(23,59,59,999)).toISOString();
  } else {
    // Agendamentos nas próximas 2h (±15min de tolerância)
    windowStart = new Date(agora.getTime() + 105 * 60000).toISOString(); // +1h45
    windowEnd   = new Date(agora.getTime() + 135 * 60000).toISOString(); // +2h15
  }

  const { rows } = await pool.query(
    `SELECT a.id, a.data_hora,
            COALESCE(c.email, '') AS email,
            COALESCE(c.telefone, a.telefone_avulso, '') AS telefone,
            COALESCE(c.nome, a.nome_avulso, 'Cliente') AS nome_cliente,
            COALESCE(p.nome, a.pet_nome_avulso, 'Pet') AS nome_pet,
            s.nome AS servico_nome
     FROM agendamentos a
     LEFT JOIN clientes c ON c.id = a.cliente_id
     LEFT JOIN pets     p ON p.id = a.pet_id
     JOIN servicos      s ON s.id = a.servico_id
     WHERE a.data_hora BETWEEN $1 AND $2
       AND a.status IN ('pendente','confirmado')`,
    [windowStart, windowEnd]
  );

  for (const a of rows) {
    const dtFormatada = formatarData(a.data_hora);
    const texto = `Olá ${a.nome_cliente}! Lembrete: seu agendamento de *${a.servico_nome}* para *${a.nome_pet}* está marcado para *${dtFormatada}*. Qualquer dúvida entre em contato conosco.`;

    // Email
    if (a.email && !(await jaEnviou(a.id, 'email', momento))) {
      const ok = await email.enviar({
        para: a.email,
        assunto: `Lembrete de agendamento — ${dtFormatada}`,
        html: `<p>${texto.replace(/\*/g, '<strong>').replace(/\*/g, '</strong>')}</p>`,
      }).catch(err => console.error('[notif email]', err.message));
      if (ok) await registrar(a.id, 'email', momento);
    }

    // WhatsApp
    if (a.telefone && !(await jaEnviou(a.id, 'whatsapp', momento))) {
      const ok = await whatsapp.enviar({ telefone: a.telefone, mensagem: texto })
        .catch(err => console.error('[notif whatsapp]', err.message));
      if (ok) await registrar(a.id, 'whatsapp', momento);
    }
  }
}

module.exports = { processarLote };
