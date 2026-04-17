const router     = require('express').Router();
const { body }   = require('express-validator');
const validate   = require('../../middlewares/validate');
const controller = require('./adminAuth.controller');

router.post('/login',
  body('email').isEmail().withMessage('E-mail inválido.'),
  body('senha').notEmpty().withMessage('Senha obrigatória.'),
  validate,
  controller.login
);

module.exports = router;
