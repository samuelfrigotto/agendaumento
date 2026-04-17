require('dotenv').config();

const required = (key) => {
  if (!process.env[key]) throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  return process.env[key];
};

module.exports = {
  NODE_ENV:    process.env.NODE_ENV || 'development',
  PORT:        parseInt(process.env.PORT || '3000', 10),

  DB_HOST:     process.env.DB_HOST || 'localhost',
  DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER:     process.env.DB_USER || 'agendaumento',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME:     process.env.DB_NAME || 'agendaumento_db',

  JWT_SECRET:  process.env.JWT_SECRET || 'dev_secret_troque_em_producao',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
};
