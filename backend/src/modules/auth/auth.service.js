const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { enviarRecuperacaoSenha } = require('../email/email.service');

const SALT_ROUNDS = 12;

const gerarTokens = (banhista) => {
  const accessToken = jwt.sign(
    { id: banhista.id, email: banhista.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: banhista.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

const registrar = async ({ nome, email, senha, telefone, nomeNegocio }) => {
  // Verificar se email ja existe
  const existente = await query(
    'SELECT id FROM banhistas WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existente.rows.length > 0) {
    throw new AppError('Email ja cadastrado', 409);
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  // Calcular fim do trial (14 dias)
  const trialFim = new Date();
  trialFim.setDate(trialFim.getDate() + 14);

  // Inserir banhista
  const result = await query(
    `INSERT INTO banhistas (nome, email, senha_hash, telefone, nome_negocio, trial_fim)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nome, email, telefone, nome_negocio, plano, trial_fim, criado_em`,
    [nome, email.toLowerCase(), senhaHash, telefone, nomeNegocio, trialFim]
  );

  const banhista = result.rows[0];
  const tokens = gerarTokens(banhista);

  return {
    banhista: {
      id: banhista.id,
      nome: banhista.nome,
      email: banhista.email,
      telefone: banhista.telefone,
      nomeNegocio: banhista.nome_negocio,
      plano: banhista.plano,
      trialFim: banhista.trial_fim
    },
    ...tokens
  };
};

const login = async (email, senha) => {
  const result = await query(
    `SELECT id, nome, email, senha_hash, telefone, nome_negocio, plano, trial_fim, ativo
     FROM banhistas WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Credenciais invalidas', 401);
  }

  const banhista = result.rows[0];

  if (!banhista.ativo) {
    throw new AppError('Conta desativada', 403);
  }

  const senhaValida = await bcrypt.compare(senha, banhista.senha_hash);

  if (!senhaValida) {
    throw new AppError('Credenciais invalidas', 401);
  }

  const tokens = gerarTokens(banhista);

  return {
    banhista: {
      id: banhista.id,
      nome: banhista.nome,
      email: banhista.email,
      telefone: banhista.telefone,
      nomeNegocio: banhista.nome_negocio,
      plano: banhista.plano,
      trialFim: banhista.trial_fim
    },
    ...tokens
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new AppError('Token invalido', 401);
    }

    const result = await query(
      'SELECT id, nome, email, ativo FROM banhistas WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].ativo) {
      throw new AppError('Usuario nao encontrado ou inativo', 401);
    }

    const banhista = result.rows[0];
    const tokens = gerarTokens(banhista);

    return tokens;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Token invalido ou expirado', 401);
  }
};

const esqueciSenha = async (email) => {
  const result = await query(
    'SELECT id, nome, senha_hash FROM banhistas WHERE email = $1',
    [email.toLowerCase()]
  );

  // Nao revelar se o email existe ou nao (segurança)
  if (result.rows.length === 0) return;

  const banhista = result.rows[0];

  // Token usa a senha_hash como parte do secret: invalida automaticamente
  // apos a senha ser trocada, sem precisar de tabela de tokens
  const token = jwt.sign(
    { id: banhista.id, type: 'reset' },
    process.env.JWT_SECRET + banhista.senha_hash,
    { expiresIn: '1h' }
  );

  await enviarRecuperacaoSenha({ email, nome: banhista.nome, token });
};

module.exports = {
  registrar,
  login,
  refreshToken,
  esqueciSenha
};
