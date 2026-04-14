const { query } = require('../../config/database');
const { verificarConexao, enviarMensagemTexto } = require('../../config/whatsapp');
const { AppError } = require('../../middlewares/errorHandler');

const getStatus = async () => {
  try {
    const status = await verificarConexao();
    return status;
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

const enviarCustom = async (banhistaId, telefone, mensagem) => {
  try {
    await enviarMensagemTexto(telefone, mensagem);

    // Registrar log
    await query(
      `INSERT INTO mensagens_whatsapp (banhista_id, telefone_destino, tipo, mensagem, status)
       VALUES ($1, $2, 'custom', $3, 'enviado')`,
      [banhistaId, telefone, mensagem]
    );

    return { success: true, message: 'Mensagem enviada com sucesso' };
  } catch (error) {
    // Registrar falha
    await query(
      `INSERT INTO mensagens_whatsapp (banhista_id, telefone_destino, tipo, mensagem, status)
       VALUES ($1, $2, 'custom', $3, 'falhou')`,
      [banhistaId, telefone, mensagem]
    );

    throw new AppError('Erro ao enviar mensagem: ' + error.message, 500);
  }
};

module.exports = {
  getStatus,
  enviarCustom
};
