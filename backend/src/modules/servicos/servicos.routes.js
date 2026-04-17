const router    = require('express').Router();
const { body }  = require('express-validator');
const validate  = require('../../middlewares/validate');
const adminAuth = require('../../middlewares/adminAuth');

// Middleware opcional: detecta admin sem bloquear
const tentaAdmin = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.admin = jwt.verify(h.slice(7), env.JWT_SECRET); } catch {}
  }
  next();
};

const ctrl = require('./servicos.controller');

// GET público (apenas ativos); admin vê todos
router.get('/', tentaAdmin, ctrl.listar);

// Escrita: somente admin
router.post('/',     adminAuth,
  body('nome').trim().notEmpty(),
  body('preco').isFloat({ min: 0 }),
  validate,
  ctrl.criar
);
router.patch('/:id',  adminAuth, ctrl.atualizar);
router.delete('/:id', adminAuth, ctrl.remover);

module.exports = router;
