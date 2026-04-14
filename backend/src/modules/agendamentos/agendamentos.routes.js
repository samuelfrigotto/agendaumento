const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth');
const { upload } = require('../../middlewares/upload');
const agendamentosController = require('./agendamentos.controller');
const { agendamentoValidator } = require('./agendamentos.validator');

router.use(auth);

router.get('/', agendamentosController.listar);
router.get('/hoje', agendamentosController.listarHoje);
router.get('/semana', agendamentosController.listarSemana);
router.post('/', agendamentoValidator, agendamentosController.criar);
router.get('/:id', agendamentosController.buscarPorId);
router.put('/:id', agendamentoValidator, agendamentosController.atualizar);
router.patch('/:id/status', agendamentosController.atualizarStatus);
router.patch('/:id/pago', agendamentosController.marcarPago);
router.delete('/:id', agendamentosController.cancelar);
router.post('/:id/avisar-pronto', agendamentosController.avisarPronto);
router.post('/:id/foto-pronto', upload.single('foto'), agendamentosController.uploadFotoPronto);

module.exports = router;
