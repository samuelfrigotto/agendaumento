const jwt = require('jsonwebtoken');
const env  = require('../config/env');

module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
