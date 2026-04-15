require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const banhistasRoutes = require('./modules/banhistas/banhistas.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const petsRoutes = require('./modules/pets/pets.routes');
const servicosRoutes = require('./modules/servicos/servicos.routes');
const agendamentosRoutes = require('./modules/agendamentos/agendamentos.routes');
const financeiroRoutes = require('./modules/financeiro/financeiro.routes');
const whatsappRoutes = require('./modules/whatsapp/whatsapp.routes');
const tiposAnimaisRoutes = require('./modules/tiposAnimais/tiposAnimais.routes');
const disponibilidadeRoutes = require('./modules/disponibilidade/disponibilidade.routes');

// Rotas para area do cliente
const publicRoutes = require('./modules/public/public.routes');
const clienteAuthRoutes = require('./modules/clienteAuth/clienteAuth.routes');
const clienteAreaRoutes = require('./modules/clienteArea/clienteArea.routes');

const app = express();

// Middlewares de seguranca
app.use(helmet());
const origensPermitidas = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'http://localhost:4201'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (curl, Insomnia, mobile apps)
    if (!origin) return callback(null, true);
    if (origensPermitidas.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Muitas requisicoes, tente novamente mais tarde.' }
});
app.use('/api/', limiter);

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estaticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas publicas (sem autenticacao)
app.use('/api/public', publicRoutes);

// Rotas de autenticacao
app.use('/api/auth', authRoutes);
app.use('/api/auth/cliente', clienteAuthRoutes);

// Rotas do cliente autenticado
app.use('/api/cliente', clienteAreaRoutes);

// Rotas do banhista (admin)
app.use('/api/banhista', banhistasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/tipos-animais', tiposAnimaisRoutes);
app.use('/api/disponibilidade', disponibilidadeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
