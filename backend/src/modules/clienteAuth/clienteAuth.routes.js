const express = require('express');
const router = express.Router();
const clienteAuthController = require('./clienteAuth.controller');
const { registroValidator, loginValidator } = require('./clienteAuth.validator');

router.post('/registro', registroValidator, clienteAuthController.registro);
router.post('/login', loginValidator, clienteAuthController.login);
router.post('/refresh', clienteAuthController.refresh);

module.exports = router;
