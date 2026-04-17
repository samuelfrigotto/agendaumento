const router    = require('express').Router();
const adminAuth = require('../../middlewares/adminAuth');
const ctrl      = require('./disponibilidade.controller');

// Público: slots disponíveis (usado no formulário de agendamento)
router.get('/slots', ctrl.slotsDisponiveis);

// Admin
router.get('/regras',              adminAuth, ctrl.listarRegras);
router.put('/regras',              adminAuth, ctrl.salvarRegras);
router.get('/bloqueios',           adminAuth, ctrl.listarBloqueados);
router.post('/bloqueios',          adminAuth, ctrl.adicionarBloqueio);
router.delete('/bloqueios/:id',    adminAuth, ctrl.removerBloqueio);

module.exports = router;
