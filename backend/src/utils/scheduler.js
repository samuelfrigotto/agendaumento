const cron   = require('node-cron');
const notif  = require('../modules/notificacoes/notificacoes.service');

function iniciar() {
  // Todos os dias às 08:00 — lembrete do dia seguinte
  cron.schedule('0 8 * * *', () => {
    console.log('[cron] processando notificações dia_antes...');
    notif.processarLote('dia_antes').catch(err => console.error('[cron dia_antes]', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  // A cada hora, em :00 — verifica agendamentos ~2h à frente
  cron.schedule('0 * * * *', () => {
    console.log('[cron] processando notificações 2h_antes...');
    notif.processarLote('2h_antes').catch(err => console.error('[cron 2h_antes]', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[scheduler] agendamento de notificações ativo.');
}

module.exports = { iniciar };
