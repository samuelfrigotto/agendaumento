const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

// Todas as rotas sao publicas (sem autenticacao)
router.get('/servicos', publicController.listarServicos);
router.get('/servicos/:id', publicController.obterServico);
router.get('/disponibilidade', publicController.obterDisponibilidade);
router.get('/estabelecimento', publicController.obterInfoEstabelecimento);

module.exports = router;
