module.exports = function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} —`, err.message);

  if (err.type === 'validation') {
    return res.status(422).json({ erro: err.message, detalhes: err.detalhes });
  }

  const status = err.status || 500;
  const msg    = status < 500 ? err.message : 'Erro interno do servidor.';
  res.status(status).json({ erro: msg });
};
