const app       = require('./app');
const env       = require('./config/env');
const scheduler = require('./utils/scheduler');

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`[server] API rodando na porta ${PORT} (${env.NODE_ENV})`);
  scheduler.iniciar();
});
