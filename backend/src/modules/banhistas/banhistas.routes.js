const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const banhistasController = require('./banhistas.controller');

router.use(auth);

router.get('/perfil', banhistasController.getPerfil);
router.put('/perfil', banhistasController.atualizarPerfil);
router.put('/senha', banhistasController.alterarSenha);
router.get('/dashboard', banhistasController.getDashboard);

module.exports = router;
