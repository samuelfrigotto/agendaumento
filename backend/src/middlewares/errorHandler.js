const errorHandler = (err, req, res, next) => {
  console.error('Erro:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Erros de validacao do express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      error: 'Erro de validacao',
      details: err.array()
    });
  }

  // Erros do PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          error: 'Registro ja existe',
          detail: err.detail
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          error: 'Referencia invalida',
          detail: err.detail
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          error: 'Campo obrigatorio ausente',
          detail: err.detail
        });
      case '22P02': // invalid_text_representation (UUID invalido)
        return res.status(400).json({
          error: 'ID invalido'
        });
      default:
        break;
    }
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token invalido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  // Erros de upload (multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande' });
  }

  // Erro generico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
