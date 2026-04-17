const router      = require('express').Router();
const { body }    = require('express-validator');
const validate    = require('../../middlewares/validate');
const clienteAuth = require('../../middlewares/clienteAuth');
const ctrl        = require('./clienteAuth.controller');

router.post('/registrar',
  body('nome').trim().notEmpty().withMessage('Nome obrigatório.'),
  body('cpf').matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/).withMessage('CPF inválido.'),
  body('telefone').notEmpty().withMessage('Telefone obrigatório.'),
  body('senha').isLength({ min: 6 }).withMessage('Senha mínima de 6 caracteres.'),
  validate,
  ctrl.registrar
);

router.post('/login',
  body('senha').notEmpty().withMessage('Senha obrigatória.'),
  validate,
  ctrl.login
);

router.get('/perfil', clienteAuth, ctrl.perfil);

module.exports = router;
