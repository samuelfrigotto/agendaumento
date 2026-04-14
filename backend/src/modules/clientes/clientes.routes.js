const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const clientesController = require('./clientes.controller');
const { clienteValidator } = require('./clientes.validator');

router.use(auth);

router.get('/', clientesController.listar);
router.post('/', clienteValidator, clientesController.criar);
router.get('/:id', clientesController.buscarPorId);
router.put('/:id', clienteValidator, clientesController.atualizar);
router.delete('/:id', clientesController.remover);

module.exports = router;
