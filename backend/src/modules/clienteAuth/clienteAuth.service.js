const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const SALT_ROUNDS = 12;

// ID do banhista de demonstracao (configurar no .env ou usar o primeiro cadastrado)
const getDemoBanhistaId = async () => {
  if (process.env.DEMO_BANHISTA_ID) {
    return process.env.DEMO_BANHISTA_ID;
  }
  // Fallback: pegar o primeiro banhista ativo
  const result = await query('SELECT id FROM banhistas WHERE ativo = true LIMIT 1');
  if (result.rows.length === 0) {
    throw new AppError('Nenhum estabelecimento disponivel', 500);
  }
  return result.rows[0].id;
};

const gerarTokens = (cliente, banhistaId) => {
  const accessToken = jwt.sign(
    {
      clienteId: cliente.id,
      email: cliente.email_auth,
      banhistaId: banhistaId,
      role: 'cliente'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    {
      clienteId: cliente.id,
      type: 'refresh',
      role: 'cliente'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

const registrar = async ({ nome, email, senha, cpf, telefone }) => {
  const banhistaId = await getDemoBanhistaId();

  // Verificar se email ja existe
  const emailExistente = await query(
    'SELECT id FROM clientes WHERE email_auth = $1',
    [email.toLowerCase()]
  );

  if (emailExistente.rows.length > 0) {
    throw new AppError('Email ja cadastrado', 409);
  }

  // Verificar se CPF ja existe
  const cpfExistente = await query(
    'SELECT id FROM clientes WHERE cpf = $1',
    [cpf]
  );

  if (cpfExistente.rows.length > 0) {
    throw new AppError('CPF ja cadastrado', 409);
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  // Inserir cliente
  const result = await query(
    `INSERT INTO clientes (banhista_id, nome, telefone, email, email_auth, senha_hash, cpf, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id, nome, telefone, email_auth, cpf, criado_em`,
    [banhistaId, nome, telefone || '', email.toLowerCase(), email.toLowerCase(), senhaHash, cpf]
  );

  const cliente = result.rows[0];
  const tokens = gerarTokens(cliente, banhistaId);

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email_auth,
      cpf: cliente.cpf,
      telefone: cliente.telefone
    },
    ...tokens
  };
};

const login = async (email, senha) => {
  const result = await query(
    `SELECT c.id, c.banhista_id, c.nome, c.email_auth, c.senha_hash, c.telefone, c.cpf, c.ativo
     FROM clientes c
     WHERE c.email_auth = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Credenciais invalidas', 401);
  }

  const cliente = result.rows[0];

  if (!cliente.ativo) {
    throw new AppError('Conta desativada', 403);
  }

  if (!cliente.senha_hash) {
    throw new AppError('Conta nao possui senha cadastrada. Por favor, registre-se.', 401);
  }

  const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);

  if (!senhaValida) {
    throw new AppError('Credenciais invalidas', 401);
  }

  const tokens = gerarTokens(cliente, cliente.banhista_id);

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email_auth,
      cpf: cliente.cpf,
      telefone: cliente.telefone
    },
    ...tokens
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh' || decoded.role !== 'cliente') {
      throw new AppError('Token invalido', 401);
    }

    const result = await query(
      'SELECT id, banhista_id, nome, email_auth, ativo FROM clientes WHERE id = $1',
      [decoded.clienteId]
    );

    if (result.rows.length === 0 || !result.rows[0].ativo) {
      throw new AppError('Usuario nao encontrado ou inativo', 401);
    }

    const cliente = result.rows[0];
    const tokens = gerarTokens(cliente, cliente.banhista_id);

    return tokens;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Token invalido ou expirado', 401);
  }
};

module.exports = {
  registrar,
  login,
  refreshToken
};
