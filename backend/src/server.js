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

// Rotas para area do cliente
const publicRoutes = require('./modules/public/public.routes');
const clienteAuthRoutes = require('./modules/clienteAuth/clienteAuth.routes');
const clienteAreaRoutes = require('./modules/clienteArea/clienteArea.routes');

const app = express();

// Middlewares de seguranca
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
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
