const nodemailer  = require('nodemailer');
const configSvc   = require('../configuracoes/configuracoes.service');

async function getTransport() {
  const host  = await configSvc.get('smtp_host');
  const port  = await configSvc.get('smtp_port');
  const user  = await configSvc.get('smtp_user');
  const pass  = await configSvc.get('smtp_pass');
  const from  = await configSvc.get('smtp_from');
  const ativo = await configSvc.get('smtp_ativo');

  if (ativo !== 'true' || !host || !user || !pass) return null;

  return {
    transporter: nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user, pass },
    }),
    from: from || user,
  };
}

async function enviar({ para, assunto, html }) {
  const cfg = await getTransport();
  if (!cfg) {
    console.log(`[email] desativado — pulando: ${assunto} -> ${para}`);
    return false;
  }
  await cfg.transporter.sendMail({ from: cfg.from, to: para, subject: assunto, html });
  console.log(`[email] enviado: ${assunto} -> ${para}`);
  return true;
}

module.exports = { enviar };
