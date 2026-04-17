const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../../config/database');
const env    = require('../../config/env');

async function login(email, senha) {
  const { rows } = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND ativo = TRUE',
    [email]
  );
  const admin = rows[0];
  if (!admin) throw { status: 401, message: 'Credenciais inválidas.' };

  const ok = await bcrypt.compare(senha, admin.senha_hash);
  if (!ok) throw { status: 401, message: 'Credenciais inválidas.' };

  const token = jwt.sign(
    { id: admin.id, nome: admin.nome, email: admin.email, role: 'admin' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { token, admin: { id: admin.id, nome: admin.nome, email: admin.email } };
}

module.exports = { login };
