/**
 * Seed: cria os 3 admins pré-definidos.
 * Rodado uma vez após migrate.
 *
 * Credenciais padrão (TROQUE as senhas após o primeiro login ou via variável de ambiente):
 *   admin1@clinica.com  / Admin@123
 *   admin2@clinica.com  / Admin@123
 *   admin3@clinica.com  / Admin@123
 */
const bcrypt = require('bcryptjs');
const pool   = require('../config/database');

const ADMINS = [
  { nome: 'Administrador 1', email: process.env.ADMIN1_EMAIL || 'admin1@clinica.com', senha: process.env.ADMIN1_SENHA || 'Admin@123' },
  { nome: 'Administrador 2', email: process.env.ADMIN2_EMAIL || 'admin2@clinica.com', senha: process.env.ADMIN2_SENHA || 'Admin@123' },
  { nome: 'Administrador 3', email: process.env.ADMIN3_EMAIL || 'admin3@clinica.com', senha: process.env.ADMIN3_SENHA || 'Admin@123' },
];

async function seed() {
  for (const adm of ADMINS) {
    const hash = await bcrypt.hash(adm.senha, 12);
    await pool.query(
      `INSERT INTO admins (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [adm.nome, adm.email, hash]
    );
    console.log(`[seed] admin garantido: ${adm.email}`);
  }
  console.log('[seed] concluído.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[seed] erro:', err.message); process.exit(1); });
