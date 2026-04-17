const axios     = require('axios');
const configSvc = require('../configuracoes/configuracoes.service');

async function enviar({ telefone, mensagem }) {
  const apiUrl   = await configSvc.get('whatsapp_api_url');
  const apiKey   = await configSvc.get('whatsapp_api_key');
  const instance = await configSvc.get('whatsapp_instance');
  const ativo    = await configSvc.get('whatsapp_ativo');

  if (ativo !== 'true' || !apiUrl || !apiKey || !instance) {
    console.log(`[whatsapp] desativado — pulando mensagem para ${telefone}`);
    return false;
  }

  // Número apenas dígitos + DDI 55
  const numero = '55' + telefone.replace(/\D/g, '');

  await axios.post(
    `${apiUrl}/message/sendText/${instance}`,
    { number: numero, text: mensagem },
    { headers: { apikey: apiKey }, timeout: 10000 }
  );
  console.log(`[whatsapp] enviado para ${numero}`);
  return true;
}

module.exports = { enviar };
