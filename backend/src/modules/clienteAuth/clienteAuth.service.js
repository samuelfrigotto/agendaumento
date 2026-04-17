const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../../config/database');
const env    = require('../../config/env');

async function registrar({ nome, cpf, telefone, endereco, email, senha }) {
  // CPF apenas dígitos para comparação
  const cpfLimpo = cpf.replace(/\D/g, '');

  const existe = await pool.query(
    'SELECT id FROM clientes WHERE cpf = $1 OR (email IS NOT NULL AND email = $2)',
    [cpfLimpo, email || null]
  );
  if (existe.rows.length > 0) {
    throw { status: 409, message: 'CPF ou e-mail já cadastrado.' };
  }

  const hash = await bcrypt.hash(senha, 12);
  const { rows } = await pool.query(
    `INSERT INTO clientes (nome, cpf, telefone, endereco, email, senha_hash)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, nome, cpf, telefone, email`,
    [nome, cpfLimpo, telefone, endereco || null, email || null, hash]
  );

  const cliente = rows[0];
  const token = jwt.sign(
    { id: cliente.id, nome: cliente.nome, role: 'cliente' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { token, cliente };
}

async function login({ cpf, email, senha }) {
  // Permite login por CPF ou e-mail
  let query, param;
  if (cpf) {
    query = 'SELECT * FROM clientes WHERE cpf = $1 AND ativo = TRUE';
    param = cpf.replace(/\D/g, '');
  } else {
    query = 'SELECT * FROM clientes WHERE email = $1 AND ativo = TRUE';
    param = email;
  }

  const { rows } = await pool.query(query, [param]);
  const cliente = rows[0];
  if (!cliente) throw { status: 401, message: 'Credenciais inválidas.' };

  const ok = await bcrypt.compare(senha, cliente.senha_hash);
  if (!ok) throw { status: 401, message: 'Credenciais inválidas.' };

  const token = jwt.sign(
    { id: cliente.id, nome: cliente.nome, role: 'cliente' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    cliente: { id: cliente.id, nome: cliente.nome, cpf: cliente.cpf, email: cliente.email, telefone: cliente.telefone },
  };
}

async function perfil(clienteId) {
  const { rows } = await pool.query(
    'SELECT id, nome, cpf, telefone, endereco, email, criado_em FROM clientes WHERE id = $1',
    [clienteId]
  );
  if (!rows[0]) throw { status: 404, message: 'Cliente não encontrado.' };
  return rows[0];
}

module.exports = { registrar, login, perfil };
