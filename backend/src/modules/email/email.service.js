const transporter = require('../../config/email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Formata data/hora em PT-BR sem depender de lib externa
const formatarDataHora = (dataHora) => {
  const d = new Date(dataHora);
  const data = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  return `${data} às ${hora}`;
};

// Envia confirmacao para o cliente apos agendamento.
// Nao lanca erro — falha de email nao deve cancelar o agendamento.
const enviarConfirmacaoCliente = async ({ nomeCliente, emailCliente, nomePet, nomeServico, dataHora }) => {
  if (!emailCliente || !process.env.SMTP_USER) return;

  try {
    await transporter.sendMail({
      from: `"Clínica Veterinária" <${process.env.SMTP_USER}>`,
      to: emailCliente,
      subject: `Agendamento confirmado — ${nomePet}`,
      text: [
        `Olá, ${nomeCliente}!`,
        '',
        `Seu agendamento foi confirmado com sucesso.`,
        '',
        `Pet: ${nomePet}`,
        `Serviço: ${nomeServico}`,
        `Data e hora: ${formatarDataHora(dataHora)}`,
        '',
        `Em caso de dúvidas ou necessidade de cancelamento, entre em contato com antecedência mínima de 2 horas.`,
        '',
        `Até breve!`
      ].join('\n')
    });
  } catch (err) {
    console.error('[email] Falha ao enviar confirmacao para cliente:', err.message);
  }
};

// Alerta o admin quando um novo agendamento é criado pelo cliente.
const enviarAlertaAdmin = async ({ nomeCliente, nomePet, nomeServico, dataHora }) => {
  if (!ADMIN_EMAIL || !process.env.SMTP_USER) return;

  try {
    await transporter.sendMail({
      from: `"Sistema de Agendamento" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Novo agendamento — ${nomePet} (${nomeCliente})`,
      text: [
        `Novo agendamento recebido:`,
        '',
        `Cliente: ${nomeCliente}`,
        `Pet: ${nomePet}`,
        `Serviço: ${nomeServico}`,
        `Data e hora: ${formatarDataHora(dataHora)}`
      ].join('\n')
    });
  } catch (err) {
    console.error('[email] Falha ao enviar alerta para admin:', err.message);
  }
};

// Notifica o cliente quando o agendamento é cancelado (por ele ou pelo admin).
const enviarCancelamentoCliente = async ({ nomeCliente, emailCliente, nomePet, nomeServico, dataHora }) => {
  if (!emailCliente || !process.env.SMTP_USER) return;

  try {
    await transporter.sendMail({
      from: `"Clínica Veterinária" <${process.env.SMTP_USER}>`,
      to: emailCliente,
      subject: `Agendamento cancelado — ${nomePet}`,
      text: [
        `Olá, ${nomeCliente}.`,
        '',
        `O agendamento abaixo foi cancelado:`,
        '',
        `Pet: ${nomePet}`,
        `Serviço: ${nomeServico}`,
        `Data e hora: ${formatarDataHora(dataHora)}`,
        '',
        `Se quiser reagendar, acesse nosso sistema de agendamento.`
      ].join('\n')
    });
  } catch (err) {
    console.error('[email] Falha ao enviar cancelamento para cliente:', err.message);
  }
};

// Email de recuperação de senha com link e token.
const enviarRecuperacaoSenha = async ({ email, nome, token }) => {
  if (!process.env.SMTP_USER) return;

  const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Clínica Veterinária" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Redefinição de senha',
      text: [
        `Olá, ${nome}!`,
        '',
        `Recebemos uma solicitação de redefinição de senha para sua conta.`,
        '',
        `Clique no link abaixo para criar uma nova senha (válido por 1 hora):`,
        link,
        '',
        `Se não foi você, ignore este e-mail.`
      ].join('\n')
    });
  } catch (err) {
    console.error('[email] Falha ao enviar recuperacao de senha:', err.message);
  }
};

module.exports = {
  enviarConfirmacaoCliente,
  enviarAlertaAdmin,
  enviarCancelamentoCliente,
  enviarRecuperacaoSenha
};
