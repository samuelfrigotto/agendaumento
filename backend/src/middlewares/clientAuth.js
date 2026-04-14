const jwt = require('jsonwebtoken');

const clientAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ error: 'Token invalido' });
      }

      // Verificar se e token de cliente
      if (decoded.role !== 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      req.clienteId = decoded.clienteId;
      req.clienteEmail = decoded.email;
      req.banhistaId = decoded.banhistaId;

      return next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Erro na autenticacao' });
  }
};

const optionalClientAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return next();
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err && decoded.role === 'cliente') {
        req.clienteId = decoded.clienteId;
        req.clienteEmail = decoded.email;
        req.banhistaId = decoded.banhistaId;
      }
      return next();
    });
  } catch (error) {
    return next();
  }
};

module.exports = { clientAuth, optionalClientAuth };
