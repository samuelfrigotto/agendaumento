const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { registroValidator, loginValidator } = require('./auth.validator');

// Registro desabilitado em producao — conta admin criada via migration ou SQL manual
// router.post('/registro', registroValidator, authController.registro);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', authController.refresh);
router.post('/esqueci-senha', authController.esqueciSenha);

module.exports = router;
