const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const servicosController = require('./servicos.controller');
const { servicoValidator } = require('./servicos.validator');

router.use(auth);

router.get('/', servicosController.listar);
router.post('/', servicoValidator, servicosController.criar);
router.put('/:id', servicoValidator, servicosController.atualizar);
router.delete('/:id', servicosController.remover);

module.exports = router;
