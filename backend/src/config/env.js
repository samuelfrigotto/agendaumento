const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('Variaveis de ambiente obrigatorias ausentes:', missing.join(', '));
    process.exit(1);
  }
};

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'http://localhost:8080',
    apiKey: process.env.WHATSAPP_API_KEY || '',
    instanceName: process.env.WHATSAPP_INSTANCE_NAME || 'agendaumento'
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 5
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

module.exports = {
  validateEnv,
  config
};
