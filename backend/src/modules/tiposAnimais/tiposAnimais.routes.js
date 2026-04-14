const express = require('express');
const router = express.Router();
const tiposAnimaisController = require('./tiposAnimais.controller');
const { criarValidator, atualizarValidator } = require('./tiposAnimais.validator');
const auth = require('../../middlewares/auth');

// Todas as rotas requerem autenticacao
router.use(auth);

// Listar todos os tipos de animais
router.get('/', tiposAnimaisController.listar);

// Listar apenas especies (sem racas)
router.get('/especies', tiposAnimaisController.listarEspecies);

// Listar racas de uma especie
router.get('/racas/:especie', tiposAnimaisController.listarRacas);

// Criar novo tipo
router.post('/', criarValidator, tiposAnimaisController.criar);

// Atualizar tipo
router.put('/:id', atualizarValidator, tiposAnimaisController.atualizar);

// Remover tipo (soft delete)
router.delete('/:id', tiposAnimaisController.remover);

module.exports = router;
