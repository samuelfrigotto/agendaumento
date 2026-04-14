const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const getPerfil = async (banhistaId) => {
  const result = await query(
    `SELECT id, nome, email, telefone, nome_negocio, whatsapp_numero, plano, trial_fim, criado_em
     FROM banhistas WHERE id = $1`,
    [banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Banhista nao encontrada', 404);
  }

  const b = result.rows[0];
  return {
    id: b.id,
    nome: b.nome,
    email: b.email,
    telefone: b.telefone,
    nomeNegocio: b.nome_negocio,
    whatsappNumero: b.whatsapp_numero,
    plano: b.plano,
    trialFim: b.trial_fim,
    criadoEm: b.criado_em
  };
};

const atualizarPerfil = async (banhistaId, dados) => {
  const result = await query(
    `UPDATE banhistas
     SET nome = COALESCE($2, nome),
         telefone = COALESCE($3, telefone),
         nome_negocio = COALESCE($4, nome_negocio),
         atualizado_em = NOW()
     WHERE id = $1
     RETURNING id, nome, email, telefone, nome_negocio`,
    [banhistaId, dados.nome, dados.telefone, dados.nomeNegocio]
  );

  if (result.rows.length === 0) {
    throw new AppError('Banhista nao encontrada', 404);
  }

  const b = result.rows[0];
  return {
    id: b.id,
    nome: b.nome,
    email: b.email,
    telefone: b.telefone,
    nomeNegocio: b.nome_negocio
  };
};

const alterarSenha = async (banhistaId, senhaAtual, novaSenha) => {
  const result = await query(
    'SELECT senha_hash FROM banhistas WHERE id = $1',
    [banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Banhista nao encontrada', 404);
  }

  const senhaValida = await bcrypt.compare(senhaAtual, result.rows[0].senha_hash);

  if (!senhaValida) {
    throw new AppError('Senha atual incorreta', 400);
  }

  const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

  await query(
    'UPDATE banhistas SET senha_hash = $2, atualizado_em = NOW() WHERE id = $1',
    [banhistaId, novaSenhaHash]
  );
};

const getDashboard = async (banhistaId) => {
  // Agendamentos de hoje
  const hojeResult = await query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos
     FROM agendamentos
     WHERE banhista_id = $1
       AND DATE(data_hora) = CURRENT_DATE`,
    [banhistaId]
  );

  // Agendamentos da semana
  const semanaResult = await query(
    `SELECT COUNT(*) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND data_hora >= DATE_TRUNC('week', CURRENT_DATE)
       AND data_hora < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'`,
    [banhistaId]
  );

  // Faturamento do mes
  const faturamentoResult = await query(
    `SELECT COALESCE(SUM(preco), 0) as total
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND pago = true
       AND DATE_TRUNC('month', data_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
    [banhistaId]
  );

  // Pendentes de pagamento
  const pendentesResult = await query(
    `SELECT COUNT(*) as total, COALESCE(SUM(preco), 0) as valor
     FROM agendamentos
     WHERE banhista_id = $1
       AND status = 'concluido'
       AND pago = false`,
    [banhistaId]
  );

  return {
    hoje: {
      total: parseInt(hojeResult.rows[0].total),
      concluidos: parseInt(hojeResult.rows[0].concluidos)
    },
    semana: {
      total: parseInt(semanaResult.rows[0].total)
    },
    faturamentoMes: parseFloat(faturamentoResult.rows[0].total),
    pendentes: {
      total: parseInt(pendentesResult.rows[0].total),
      valor: parseFloat(pendentesResult.rows[0].valor)
    }
  };
};

module.exports = {
  getPerfil,
  atualizarPerfil,
  alterarSenha,
  getDashboard
};
