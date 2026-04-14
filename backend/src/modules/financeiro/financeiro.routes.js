const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const financeiroController = require('./financeiro.controller');

router.use(auth);

router.get('/resumo', financeiroController.getResumo);
router.get('/historico', financeiroController.getHistorico);
router.get('/pendentes', financeiroController.getPendentes);

module.exports = router;
