const axios = require('axios');

const EVOLUTION_URL = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.WHATSAPP_API_KEY || '';
const INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || 'agendaumento';

const whatsappClient = axios.create({
  baseURL: EVOLUTION_URL,
  headers: {
    'apikey': EVOLUTION_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

const formatarTelefone = (telefone) => {
  const numeros = telefone.replace(/\D/g, '');

  if (numeros.startsWith('55')) {
    return `${numeros}@s.whatsapp.net`;
  }
  return `55${numeros}@s.whatsapp.net`;
};

const enviarMensagemTexto = async (telefone, mensagem) => {
  const numeroFormatado = formatarTelefone(telefone);

  const response = await whatsappClient.post(`/message/sendText/${INSTANCE_NAME}`, {
    number: numeroFormatado,
    text: mensagem
  });

  return response.data;
};

const enviarMensagemComImagem = async (telefone, mensagem, imagemUrl) => {
  const numeroFormatado = formatarTelefone(telefone);

  const response = await whatsappClient.post(`/message/sendMedia/${INSTANCE_NAME}`, {
    number: numeroFormatado,
    mediatype: 'image',
    media: imagemUrl,
    caption: mensagem
  });

  return response.data;
};

const verificarConexao = async () => {
  try {
    const response = await whatsappClient.get(`/instance/connectionState/${INSTANCE_NAME}`);
    return response.data;
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

const gerarQRCode = async () => {
  try {
    const response = await whatsappClient.get(`/instance/connect/${INSTANCE_NAME}`);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao gerar QR Code: ' + error.message);
  }
};

module.exports = {
  formatarTelefone,
  enviarMensagemTexto,
  enviarMensagemComImagem,
  verificarConexao,
  gerarQRCode
};
