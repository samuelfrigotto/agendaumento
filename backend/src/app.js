require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const env          = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

const adminAuthRoutes    = require('./modules/adminAuth/adminAuth.routes');
const clienteAuthRoutes  = require('./modules/clienteAuth/clienteAuth.routes');
const clientesRoutes     = require('./modules/clientes/clientes.routes');
const tiposAnimaisRoutes = require('./modules/tiposAnimais/tiposAnimais.routes');
const petsRoutes         = require('./modules/pets/pets.routes');
const servicosRoutes     = require('./modules/servicos/servicos.routes');
const disponibRoutes     = require('./modules/disponibilidade/disponibilidade.routes');
const agendRoutes        = require('./modules/agendamentos/agendamentos.routes');
const financeiroRoutes   = require('./modules/financeiro/financeiro.routes');
const configRoutes       = require('./modules/configuracoes/configuracoes.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

app.use('/api/admin/auth',          authLimiter, adminAuthRoutes);
app.use('/api/auth',                authLimiter, clienteAuthRoutes);
app.use('/api/admin/clientes',      clientesRoutes);
app.use('/api/tipos-animais',       tiposAnimaisRoutes);
app.use('/api/pets',                petsRoutes);
app.use('/api/servicos',            servicosRoutes);
app.use('/api/disponibilidade',     disponibRoutes);
app.use('/api/agendamentos',        agendRoutes);
app.use('/api/admin/financeiro',    financeiroRoutes);
app.use('/api/admin/configuracoes', configRoutes);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use(errorHandler);

module.exports = app;
