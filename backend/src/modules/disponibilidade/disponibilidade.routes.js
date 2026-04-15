const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const controller = require('./disponibilidade.controller');

// Todas as rotas exigem auth de admin (banhista)
router.use(auth);

// Regras semanais de atendimento
router.get('/regras', controller.listarRegras);
router.put('/regras', controller.atualizarRegras);

// Bloqueios de datas/períodos
router.get('/bloqueios', controller.listarBloqueios);
router.post('/bloqueios', controller.criarBloqueio);
router.delete('/bloqueios/:id', controller.removerBloqueio);

module.exports = router;
